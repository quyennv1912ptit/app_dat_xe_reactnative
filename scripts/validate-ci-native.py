"""Dừng sớm nếu Firebase hoặc credentials của app bị gán nhầm."""
import json
import os
from pathlib import Path
import plistlib
import subprocess
import tempfile

app = os.environ['APP_NAME']
if app not in ('customer', 'driver'):
    raise SystemExit('App không hợp lệ')
root = Path('apps') / app
package = f'com.datxe.{app}'
with (root / 'google-services.json').open(encoding='utf-8-sig') as stream:
    android = json.load(stream)
plist_name = 'GoogleServiceCustomer-Info.plist' if app == 'customer' else 'GoogleServiceDriver-Info.plist'
with (root / plist_name).open('rb') as stream:
    ios = plistlib.load(stream)
packages = [c.get('client_info', {}).get('android_client_info', {}).get('package_name')
            for c in android.get('client', [])]
if package not in packages or ios.get('BUNDLE_ID') != package:
    raise SystemExit('Firebase package/bundle ID không khớp app được chọn')
if ios.get('PROJECT_ID') != android.get('project_info', {}).get('project_id'):
    raise SystemExit('Firebase Android và iOS thuộc hai project khác nhau')
# Tạo CSR tạm để xác minh cả store password, alias và private-key password.
with tempfile.TemporaryDirectory() as directory:
    result = subprocess.run([
        'keytool', '-certreq', '-keystore', os.environ['ANDROID_KEYSTORE_PATH'],
        '-alias', os.environ['ANDROID_KEY_ALIAS'],
        '-storepass:env', 'ANDROID_STORE_PASSWORD',
        '-keypass:env', 'ANDROID_KEY_PASSWORD',
        '-file', str(Path(directory) / 'check.csr'),
    ], capture_output=True)
    if result.returncode:
        raise SystemExit('Không mở được private key: kiểm tra keystore, alias và hai password secrets')
print(f'{app}: Firebase IDs và private key hợp lệ')
