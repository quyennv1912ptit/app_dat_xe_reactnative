"""Giải mã Base64 nghiêm ngặt; không in nội dung secrets ra log."""
import base64
import os
from pathlib import Path
import uuid

app = os.environ["APP_NAME"]
if app not in ("customer", "driver"):
    raise SystemExit("App không hợp lệ")
app_dir = Path("apps") / app
plist = "GoogleServiceCustomer-Info.plist" if app == "customer" else "GoogleServiceDriver-Info.plist"
files = {"ENV_B64": ".env", "IOS_B64": plist,
         "ANDROID_B64": "google-services.json", "KEYSTORE_B64": f"team-dev-{app}.jks"}
for name, filename in files.items():
    value = os.environ.get(name, "")
    if not value:
        raise SystemExit(f"Thiếu secret: {name}")
    try:
        content = base64.b64decode("".join(value.split()), validate=True)
    except ValueError:
        raise SystemExit(f"Base64 không hợp lệ: {name}") from None
    if not content:
        raise SystemExit(f"Secret rỗng: {name}")
    target = app_dir / filename
    target.write_bytes(content)
    target.chmod(0o600)

# Mật khẩu/alias là secrets dạng text, không phải Base64.
values = {"ANDROID_KEYSTORE_PATH": str((app_dir / files["KEYSTORE_B64"]).resolve())}
for source, destination in {"STORE_PASSWORD": "ANDROID_STORE_PASSWORD",
                            "KEY_ALIAS": "ANDROID_KEY_ALIAS",
                            "KEY_PASSWORD": "ANDROID_KEY_PASSWORD"}.items():
    value = os.environ.get(source, "")
    if not value or "\n" in value or "\r" in value:
        raise SystemExit(f"Secret thiếu hoặc chứa xuống dòng: {source}")
    values[destination] = value
with open(os.environ["GITHUB_ENV"], "a", encoding="utf-8") as output:
    for name, value in values.items():
        delimiter = f"SECRET_{uuid.uuid4().hex}"
        output.write(f"{name}<<{delimiter}\n{value}\n{delimiter}\n")
