#!/usr/bin/env python3
"""
Access-gate E2E: a non-admin (cashier) signing in must land on the Access Denied
screen, NOT the variants UI. Run after native-e2e.py (app is admin-logged-in).
"""
import os, re, time, subprocess, sys, xml.etree.ElementTree as ET

ADB = os.path.expanduser('~/Library/Android/sdk/platform-tools/adb')
CASHIER = 'cashier-test@example.com'
PW = 'password123'

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
def tap(**kw):
    for _ in range(8):
        c = find(dump(), **kw)
        if c: shell(f'input tap {c[0]} {c[1]}'); time.sleep(0.8); return c
        time.sleep(1)
    return None
def set_text(resid, value):
    c = find(dump(), resid=resid)
    if not c: return False
    shell(f'input tap {c[0]} {c[1]}'); time.sleep(0.3)
    shell('input keyevent KEYCODE_MOVE_END')
    for _ in range(30): shell('input keyevent 67')
    shell(f'input text "{value}"'); time.sleep(0.3)
    shell('input keyevent 4'); time.sleep(0.3)
    return True

ok = True
def check(name, cond, detail=''):
    global ok
    ok = ok and cond
    print(('PASS' if cond else 'FAIL') + f' | {name}' + (f' — {detail}' if detail else ''))

# 0. get back to the list if we're on a detail screen
for _ in range(3):
    if find(dump(), resid='signout-button') or find(dump(), resid='access-signout') or find(dump(), resid='signin-button'):
        break
    shell('input keyevent 4'); time.sleep(1.5)
# 1. sign out if on the list
if find(dump(), resid='signout-button'):
    tap(resid='signout-button'); time.sleep(3)
# if on access-denied already, sign out from there
if find(dump(), resid='access-signout'):
    tap(resid='access-signout'); time.sleep(3)

check('On login screen', find(dump(), resid='signin-button') is not None)

# 2. sign in as cashier
set_text('email-input', CASHIER)
set_text('password-input', PW)
tap(resid='signin-button')
time.sleep(6)

# 3. must be Access Denied, NOT the variants list
x = dump()
denied = find(x, resid='access-signout') is not None or 'No admin access' in x
listed = find(x, resid='variants-list') is not None
check('Cashier sees Access Denied (not variants)', denied and not listed,
      f'denied={denied} list={listed}')

# 4. sign out to restore login screen
if find(dump(), resid='access-signout'):
    tap(resid='access-signout'); time.sleep(3)
check('Signed back out to login', find(dump(), resid='signin-button') is not None
      or find(dump(), resid='dev-bypass-button') is not None)

print('\n=== GATE TEST:', 'PASS' if ok else 'FAIL', '===')
sys.exit(0 if ok else 1)
