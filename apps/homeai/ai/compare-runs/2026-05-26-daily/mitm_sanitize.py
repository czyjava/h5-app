import json
from datetime import datetime, timezone
from urllib.parse import parse_qs

from mitmproxy import http


SENSITIVE_KEYS = {
    "token",
    "access_token",
    "refresh_token",
    "password",
    "passwd",
    "mobile",
    "phone",
    "phoneNumber",
    "idCard",
    "id_card",
    "smsCode",
    "verifyCode",
    "authorization",
    "cookie",
}

LOG_PATH = "ai/compare-runs/2026-05-26-daily/mitm-summary.jsonl"


def _mask_key(key: str) -> str:
    lowered = key.lower()
    for candidate in SENSITIVE_KEYS:
        if candidate.lower() in lowered:
            return f"{key}:<sensitive>"
    return key


def _extract_json_keys(text: str) -> list[str]:
    try:
        payload = json.loads(text)
    except Exception:
        return []
    if isinstance(payload, dict):
        return [_mask_key(key) for key in payload.keys()]
    return []


def _extract_form_keys(text: str) -> list[str]:
    try:
        parsed = parse_qs(text, keep_blank_values=True)
    except Exception:
        return []
    return sorted({_mask_key(key) for key in parsed.keys()})


def _extract_response_keys(flow: http.HTTPFlow) -> list[str]:
    if not flow.response:
        return []
    content_type = flow.response.headers.get("content-type", "")
    if "application/json" not in content_type.lower():
        return []
    return _extract_json_keys(flow.response.get_text(strict=False))


def response(flow: http.HTTPFlow) -> None:
    request_text = flow.request.get_text(strict=False)
    content_type = flow.request.headers.get("content-type", "")
    request_body_keys = []
    if "application/json" in content_type.lower():
        request_body_keys = _extract_json_keys(request_text)
    elif "application/x-www-form-urlencoded" in content_type.lower():
        request_body_keys = _extract_form_keys(request_text)

    query_keys = sorted({_mask_key(key) for key in flow.request.query.keys()})
    record = {
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "method": flow.request.method,
        "scheme": flow.request.scheme,
        "host": flow.request.pretty_host,
        "path": flow.request.path.split("?")[0],
        "queryKeys": query_keys,
        "requestBodyKeys": request_body_keys,
        "statusCode": flow.response.status_code if flow.response else None,
        "responseContentType": flow.response.headers.get("content-type", "") if flow.response else "",
        "responseKeys": _extract_response_keys(flow),
    }
    # 只落脱敏摘要，避免在抓包产物里记录真实敏感值。
    with open(LOG_PATH, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")
