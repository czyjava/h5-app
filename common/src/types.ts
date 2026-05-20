export type ReplicaEnvironment = 'production' | 'test';

export interface ReplicaHostConfig {
  proxyPrefix: string;
  productionTarget: string;
  testTarget?: string;
  signKey?: string;
  extraQuery?: Record<string, string>;
}

export interface ReplicaAppConfig {
  appId: string;
  displayName: string;
  packageName: string;
  version: string;
  product: string;
  productCategory: string;
  hosts: Record<string, ReplicaHostConfig>;
  endpoints: Record<string, string>;
}

export type ReplicaRequestParamValue = string | number | boolean | null | undefined;

export interface ReplicaDeviceProfile {
  system: string;
  clv: string;
  language: string;
  vendor: string;
  operator: string;
  manufacturer: string;
  platform: string;
  renyuan: string;
  appName: string;
  systemVersion: string;
  launch: string;
  network: string;
  userAgent: string;
}

export interface ReplicaCommonQuery {
  _system: string;
  _clv: string;
  _wmLang?: string;
  _pkgName: string;
  _vendor: string;
  _operator: string;
  _product: string;
  _productCategory: string;
  _manufacturer: string;
  _platform: string;
  _renyuan: string;
  _appName: string;
  _systemVersion: string;
  _launch: string;
  _version: string;
  _network: string;
  authToken?: string;
}
