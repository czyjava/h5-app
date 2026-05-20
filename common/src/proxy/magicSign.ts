import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const MAGIC_SIGN_PREFIX = '*#06#';
const MAGIC_XOR = 42;
const BASIC_PARAM_KEY_MAP: Record<string, string> = {
  _androidId: '1',
  _appUser: '3',
  _gpsCity: '4',
  _longitude: '5',
  _latitude: '6',
  _userCity: '7',
  _ipCity: '8',
  _cityCode: '9',
  _cityName: 'a',
  _device: 'b',
  _imei: 'c',
  _mac: 'e',
  _screenDpi: 'l',
  _screenHeight: 'm',
  _screenWidth: 'n',
  _jail: 'r',
  _gpsType: 'v',
  _firstTime: 'w',
  _srv: 'x',
  _u: 'y',
  _deviceId: 'z',
  _oaid: 'A',
  _it: 'B',
  _ut: 'C',
  _j: 'D',
  _html5: 'E',
  _a: 'G',
  _apiLevel: 'H',
  _rV: 'I',
  _rN: 'J',
  _br: 'K',
  _md: 'L',
};

function md5(input: string | Buffer) {
  return createHash('md5').update(input).digest();
}

function md5Hex(input: string | Buffer) {
  return md5(input).toString('hex');
}

function sha1(input: string | Buffer) {
  return createHash('sha1').update(input).digest();
}

function nativeUrlEncode(value: string) {
  // 对齐客户端旧版 URL escape 行为，额外转义 !'()*。
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildNativeQuery(params: Map<string, string>) {
  const queryItems = Array.from(params.entries()).map(([key, value]) => `${key}=${nativeUrlEncode(value)}`);
  return queryItems.sort((left, right) => left.localeCompare(right)).join('&');
}

function keyVersion(rawKey: string) {
  return Array.from(Buffer.from(rawKey, 'utf8') as Uint8Array).reduce((sum: number, byte: number) => sum + byte, 0) % 19;
}

function decodeRealSignKey(rawKey: string) {
  const realKey = Buffer.from(rawKey, 'base64');
  const zeroIndex = realKey.indexOf(0);
  const keyLength = zeroIndex >= 0 ? zeroIndex : realKey.length;
  for (let index = 0; index < keyLength; index += 1) {
    realKey[index] = (((realKey[index] - MAGIC_XOR) & 0xff) ^ MAGIC_XOR) & 0xff;
  }
  return realKey.subarray(0, keyLength);
}

function signUrl0(urlSignPart: string, realKey: Buffer) {
  return md5(Buffer.concat([Buffer.from(urlSignPart, 'utf8'), realKey]));
}

function signUrl3(urlSignPart: string, realKey: Buffer) {
  const md5Key = md5(realKey);
  const sha1Url = sha1(urlSignPart);
  const concated = Buffer.concat([md5Key, sha1Url]);
  for (let index = 0; index < concated.length; index += 2) {
    concated[index] = concated[index] ^ 34;
  }
  return md5(concated);
}

function signUrl1(urlSignPart: string, keyWithOptionalPrefix: string) {
  const rawKey = keyWithOptionalPrefix.startsWith(MAGIC_SIGN_PREFIX)
    ? keyWithOptionalPrefix.slice(MAGIC_SIGN_PREFIX.length)
    : keyWithOptionalPrefix;
  const version = keyVersion(rawKey);
  const realKey = decodeRealSignKey(rawKey);
  const signBytes = version === 3 ? signUrl3(urlSignPart, realKey) : signUrl0(urlSignPart, realKey);
  const finalBytes = version > 0 ? Buffer.concat([signBytes, Buffer.from([version])]) : signBytes;
  return finalBytes.toString('hex');
}

function signCanonicalUrl(urlString: string, signKey: string) {
  const url = new URL(urlString);
  const signPart = `${url.pathname}${url.search}`;
  return signUrl1(signPart, signKey);
}

function crc16Modbus(data: Buffer) {
  if (data.length === 0) {
    return 0;
  }
  let crc = 0xffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >> 1) ^ 0xa001 : crc >> 1;
    }
  }
  return crc & 0xffff;
}

function specialCrcData(crc: number) {
  // 客户端 specialCrcData 使用低位在前、高位在后。
  return Buffer.from([crc & 0xff, (crc >> 8) & 0xff]);
}

function createSecretBasicValue(params: Map<string, string>, rValue: string) {
  const secretQueryItems: string[] = [];
  for (const [key, value] of params.entries()) {
    const replaceKey = BASIC_PARAM_KEY_MAP[key];
    if (replaceKey) {
      secretQueryItems.push(`${replaceKey}=${value}`);
    }
  }

  const queryData = Buffer.from(secretQueryItems.join('&'), 'utf8');
  const uuidCrcData = specialCrcData(crc16Modbus(Buffer.from(rValue, 'utf8')));
  const paramsCrcData = specialCrcData(crc16Modbus(queryData));
  const xorData = Buffer.from(Array.from(queryData as Uint8Array, (byte: number) => byte ^ uuidCrcData[0]));
  return gzipSync(Buffer.concat([xorData, paramsCrcData, uuidCrcData])).toString('base64');
}

function createRValue() {
  return md5Hex(randomUUID().toUpperCase());
}

export interface SignedUrlResult {
  unsignedUrl: string;
  signedUrl: string;
  addedParams: string[];
}

export function buildSignedReplicaUrl(
  rawUrl: string,
  signKey?: string,
  extraQuery: Record<string, string> = {},
): SignedUrlResult {
  if (!signKey) {
    return {
      unsignedUrl: rawUrl,
      signedUrl: rawUrl,
      addedParams: [],
    };
  }

  const url = new URL(rawUrl);
  const params = new Map<string, string>();
  url.searchParams.forEach((value, key) => {
    if (key !== 'sign' && key !== '_r' && key !== '_v') {
      params.set(key, value);
    }
  });

  for (const [key, value] of Object.entries(extraQuery)) {
    if (!params.has(key) || params.get(key) === '') {
      params.set(key, value);
    }
  }

  const rValue = createRValue();
  params.set('_v', createSecretBasicValue(params, rValue));
  params.set('_r', rValue);

  const query = buildNativeQuery(params);
  const unsignedUrl = `${url.origin}${url.pathname}${query ? `?${query}` : ''}`;
  const sign = signCanonicalUrl(unsignedUrl, signKey);
  return {
    unsignedUrl,
    signedUrl: `${unsignedUrl}${query ? '&' : '?'}sign=${sign}`,
    addedParams: ['_v', '_r', 'sign'],
  };
}
