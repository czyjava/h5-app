import json
import os
import re
from datetime import datetime, timezone
from urllib.parse import parse_qs

from mitmproxy import http


SENSITIVE_KEY_PARTS = (
    "token",
    "password",
    "passwd",
    "mobile",
    "phone",
    "idcard",
    "id_card",
    "sms",
    "code",
    "authorization",
    "cookie",
)

LOG_PATH = os.environ.get(
    "HOMEAI_MITM_LOG",
    "ai/feature-inventory/2026-05-26/api/mitm-summary.jsonl",
)
SAFE_FORM_KEY_PATTERN = re.compile(r"^[A-Za-z0-9_.:-]{1,80}$")


def _mask_key(key: str) -> str:
    lowered = key.lower()
    if any(part in lowered for part in SENSITIVE_KEY_PARTS):
        return f"{key}:<sensitive>"
    return key


def _json_keys(text: str) -> list[str]:
    try:
        value = json.loads(text)
    except Exception:
        return []
    if isinstance(value, dict):
        return [_mask_key(str(key)) for key in value.keys()]
    return []


def _form_keys(text: str) -> list[str]:
    try:
        parsed = parse_qs(text, keep_blank_values=True)
    except Exception:
        return []
    keys = set(parsed.keys())
    if keys and any(not SAFE_FORM_KEY_PATTERN.match(key) for key in keys):
        # APK 中部分表单体是加密或非标准格式，只记录“存在请求体”，避免敏感或乱码内容落盘。
        return ["<encrypted-or-nonstandard-form>"]
    return sorted({_mask_key(key) for key in keys})


def _body_keys(flow: http.HTTPFlow) -> list[str]:
    content_type = flow.request.headers.get("content-type", "").lower()
    text = flow.request.get_text(strict=False)
    if "application/json" in content_type:
        return _json_keys(text)
    if "application/x-www-form-urlencoded" in content_type:
        return _form_keys(text)
    return []


def response(flow: http.HTTPFlow) -> None:
    # 功能盘点只需要接口形状和字段类别，真实敏感值必须在落盘前脱敏。
    record = {
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "method": flow.request.method,
        "host": flow.request.pretty_host,
        "path": flow.request.path.split("?")[0],
        "queryKeys": sorted({_mask_key(key) for key in flow.request.query.keys()}),
        "requestBodyKeys": _body_keys(flow),
        "statusCode": flow.response.status_code if flow.response else None,
        "responseContentType": flow.response.headers.get("content-type", "") if flow.response else "",
        "responseKeys": _json_keys(flow.response.get_text(strict=False)) if flow.response else [],
    }
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")
