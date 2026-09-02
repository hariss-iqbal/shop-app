#!/usr/bin/env python3
"""
E2E: create a brand-new model + variant from the mobile app (manual entry, since
GSMArena is currently behind Cloudflare). Verifies the model + variant land in
the local DB, then cleans them up. Also exercises the GSMArena lookup button to
confirm it degrades gracefully.
"""
import os, re, time, subprocess, sys, xml.etree.ElementTree as ET

ADB = os.path.expanduser('~/Library/Android/sdk/platform-tools/adb')
PSQL_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
APPLE_BRAND = '11111111-1111-1111-1111-111111111111'
MODEL = 'ZZ Test Phone'   # unique, easy to clean up
results = []

def check(n, ok, d=''):
    results.append(ok); print(('PASS' if ok else 'FAIL') + f' | {n}' + (f' — {d}' if d else ''))
def shell(c): return subprocess.run([ADB, 'shell', c], capture_output=True, text=True).stdout
def dump():
    shell('uiautomator dump /sdcard/d.xml >/dev/null 2>&1')
    return subprocess.run([ADB, 'shell', 'cat', '/sdcard/d.xml'], capture_output=True, text=True).stdout
def center(b):
    m = re.findall(r'\[(\d+),(\d+)\]', b); (x1,y1),(x2,y2)=[(int(a),int(c)) for a,c in m]; return ((x1+x2)//2,(y1+y2)//2)
def find(x, resid=None, desc=None, text=None):
    for n in ET.fromstring(x).iter('node'):
        if resid and n.get('resource-id') == resid: return center(n.get('bounds'))
        if desc and desc in (n.get('content-desc') or ''): return center(n.get('bounds'))
        if text and text in (n.get('text') or ''): return center(n.get('bounds'))
    return None
def tap(scroll=True, tries=6, **kw):
    for _ in range(tries):
        c = find(dump(), **kw)
        if c: shell(f'input tap {c[0]} {c[1]}'); time.sleep(0.8); return c
        if scroll: shell('input swipe 540 1700 540 800 250'); time.sleep(0.5)
        else: time.sleep(1)
    return None
def set_text(resid, value):
    c = None
    for _ in range(6):
        c = find(dump(), resid=resid)
        if c: break
        shell('input swipe 540 1700 540 800 250'); time.sleep(0.5)
    if not c: return False
    shell(f'input tap {c[0]} {c[1]}'); time.sleep(0.3)
    shell('input keyevent KEYCODE_MOVE_END')
    for _ in range(24): shell('input keyevent 67')
    shell(f'input text "{value.replace(chr(32), "%s")}"'); time.sleep(0.3)
    shell('input keyevent 4'); time.sleep(0.3)
    return True
def psql(q): return subprocess.run(['psql', PSQL_URL, '-tAc', q], capture_output=True, text=True).stdout.strip()

# cleanup any prior run
psql(f"delete from variants where model_id in (select id from models where name='{MODEL}')")
psql(f"delete from models where name='{MODEL}'")

# login if needed
if find(dump(), resid='dev-bypass-button'):
    tap(scroll=False, resid='dev-bypass-button'); time.sleep(4)
check('On variants list', find(dump(), resid='variants-list') is not None or find(dump(), resid='add-variant-button') is not None)
check('+ Add button present in header', find(dump(), resid='add-variant-button') is not None,
      'header button exists (Expo Go overlay covers it; deep-link used to open)')

# open Add variant via deep link (the Expo Go dev overlay sits over the header
# + button; in a standalone APK the button works directly).
shell('am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081/--/add-variant" >/dev/null 2>&1')
time.sleep(3)
check('Add-variant screen open', find(dump(), resid='add-variant') is not None or find(dump(), resid='model-name-input') is not None)

# brand + model
check('Picked brand (Apple)', tap(resid=f'brand-{APPLE_BRAND}') is not None)
set_text('model-name-input', MODEL)

# GSMArena lookup must not crash (graceful note)
tap(scroll=False, resid='gsmarena-lookup'); time.sleep(6)
x = dump()
check('GSMArena lookup handled gracefully', find(x, resid='add-variant') is not None,
      'screen still alive after lookup')

# config
set_text('storage-input', '256')
tap(resid='condition-used')
tap(resid='pta-non_pta')
set_text('colors-input', 'Black, Silver')
set_text('price-input', '55000')

# create
check('Tapped Create', tap(resid='create-variant-button') is not None)
time.sleep(4)

# verify DB
row = psql(f"""select v.storage_gb||'|'||v.condition||'|'||coalesce(v.pta_status,'')||'|'||v.selling_price||'|'||array_to_string(v.available_colors,',')
 from variants v join models m on m.id=v.model_id where m.name='{MODEL}' limit 1""")
check('New model+variant created in DB', row.startswith('256|used|non_pta|55000'), row or '(no row)')
check('Navigated to new variant detail', find(dump(), resid='variant-detail') is not None
      or find(dump(), resid='price-input') is not None)

# cleanup
psql(f"delete from variants where model_id in (select id from models where name='{MODEL}')")
psql(f"delete from models where name='{MODEL}'")
print('cleaned up; remaining test models:', psql(f"select count(*) from models where name='{MODEL}'"))

print('\n=== CREATE TEST:', 'PASS' if all(results) else 'FAIL', f'({sum(results)}/{len(results)}) ===')
sys.exit(0 if all(results) else 1)
