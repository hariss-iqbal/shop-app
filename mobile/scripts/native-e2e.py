#!/usr/bin/env python3
"""
Native Android E2E for the SmartCell app on a (headless) emulator + LOCAL backend.

Drives the real RN UI via adb + uiautomator (testIDs surface as resource-id) and
verifies EVERY change against the local Postgres via psql — so persistence is
proven at the source of truth, not just in-app.

Flow:
  1. Ensure logged in (dev bypass if on Login).
  2. Confirm list is grouped by model.
  3. Search -> clear (x) button works.
  4. Open a single-config variant (iPhone 13).
  5. Edit selling price -> Save -> assert DB (+ cascade to linked product).
  6. Edit all detail columns (storage/condition/PTA/colors) -> Save -> assert DB.
  7. Toggle visibility -> assert DB.
  8. Upload an image (system photo picker) -> assert variant_images row in DB.
  9. Re-open the variant -> assert the edited values are shown (in-app persistence).
 10. Restore original DB values + remove the test image.
"""
import os, re, sys, time, subprocess, xml.etree.ElementTree as ET

ADB = os.path.expanduser('~/Library/Android/sdk/platform-tools/adb')
PSQL_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
VARIANT_ID = 'adfe6e87-7fcc-4c4d-9564-dc2d8f67f7d9'  # iPhone 13 (single config)
IMG = '/tmp/test.jpg'

results = []
def check(name, ok, detail=''):
    results.append((name, ok, detail))
    print(('PASS' if ok else 'FAIL') + f' | {name}' + (f' — {detail}' if detail else ''))

def shell(cmd):
    return subprocess.run([ADB, 'shell', cmd], capture_output=True, text=True).stdout

def dump():
    shell('uiautomator dump /sdcard/ui.xml >/dev/null 2>&1')
    return subprocess.run([ADB, 'shell', 'cat', '/sdcard/ui.xml'], capture_output=True, text=True).stdout

def center(b):
    m = re.findall(r'\[(\d+),(\d+)\]', b)
    (x1, y1), (x2, y2) = [(int(a), int(c)) for a, c in m]
    return ((x1 + x2) // 2, (y1 + y2) // 2)

def find(xml, resid=None, desc_sub=None, text=None):
    try:
        root = ET.fromstring(xml)
    except Exception:
        return None
    for n in root.iter('node'):
        if resid and n.get('resource-id') == resid:
            return center(n.get('bounds'))
        if desc_sub and desc_sub in (n.get('content-desc') or ''):
            return center(n.get('bounds'))
        if text and n.get('text') == text:
            return center(n.get('bounds'))
    return None

def tap_xy(x, y):
    shell(f'input tap {x} {y}')

def find_scroll(resid=None, desc_sub=None, text=None, tries=6):
    """Find an element, scrolling the screen down if it's below the fold."""
    for i in range(tries):
        c = find(dump(), resid, desc_sub, text)
        if c:
            return c
        shell('input swipe 540 1700 540 700 250')
        time.sleep(0.6)
    return None

def tap(resid=None, desc_sub=None, text=None, tries=6):
    c = find_scroll(resid, desc_sub, text, tries)
    if not c:
        return False
    tap_xy(*c)
    time.sleep(0.8)
    return True

def set_text(resid, value):
    c = find_scroll(resid)
    if not c:
        return False
    tap_xy(*c); time.sleep(0.4)
    shell('input keyevent KEYCODE_MOVE_END')
    for _ in range(18):
        shell('input keyevent 67')  # backspace
    shell(f'input text "{value.replace(chr(32), "%s")}"')
    time.sleep(0.3)
    shell('input keyevent 4')  # close soft keyboard
    time.sleep(0.4)
    return True

def psql(q):
    r = subprocess.run(['psql', PSQL_URL, '-tAc', q], capture_output=True, text=True)
    return r.stdout.strip()

def main():
    # capture originals for restore
    orig = psql(f"select storage_gb||'|'||condition||'|'||coalesce(pta_status,'')||'|'||selling_price||'|'||is_active||'|'||array_to_string(available_colors,',') from variants where id='{VARIANT_ID}'")
    print('ORIGINAL:', orig)

    # 1. login if needed
    xml = dump()
    if find(xml, 'dev-bypass-button'):
        tap('dev-bypass-button'); time.sleep(4)
    check('Logged in (variants list visible)', find_scroll('variants-list', tries=4) is not None)

    # 2. grouping
    xml = dump()
    grouped = ('models' in xml and 'variants' in xml)
    check('List grouped by model', grouped, 'header shows N models · M variants')

    # 3. search clear button
    set_text('search-input', 'iphone')
    time.sleep(1.2)
    has_clear = find(dump(), 'search-clear') is not None
    check('Search clear (x) button appears', has_clear)
    if has_clear:
        tap('search-clear'); time.sleep(1.2)
        # after clearing, more than one model shows again
        xml = dump()
        check('Search cleared', xml.count('model-') >= 2, f"{xml.count('model-')} model nodes")

    # 4. open the iPhone 13 variant
    opened = tap(resid=f'variant-row-{VARIANT_ID}', tries=8)
    if not opened:
        opened = tap(desc_sub='Rs 83,000', tries=8)
    time.sleep(1.2)
    check('Opened variant detail', find_scroll('variant-detail', tries=4) is not None or find_scroll('price-input', tries=2) is not None)

    # 5. edit price
    set_text('price-input', '99999')
    tap('save-price-button'); time.sleep(2.5)
    db_price = psql(f"select selling_price from variants where id='{VARIANT_ID}'")
    db_prod = psql(f"select distinct selling_price from products where variant_id='{VARIANT_ID}' and product_type='phone'")
    check('Price persisted to DB', db_price.startswith('99999'), f'variants.selling_price={db_price}')
    check('Price cascaded to linked product', db_prod.startswith('99999'), f'products.selling_price={db_prod}')

    # 6. edit all detail columns
    set_text('storage-input', '256')
    tap('condition-used'); time.sleep(0.4)
    tap('pta-pta_approved'); time.sleep(0.4)
    set_text('colors-input', 'Blue, Graphite')
    tap('save-details-button'); time.sleep(2.5)
    row = psql(f"select storage_gb||'|'||condition||'|'||coalesce(pta_status,'')||'|'||array_to_string(available_colors,',') from variants where id='{VARIANT_ID}'")
    check('Storage persisted', row.startswith('256|'), row)
    check('Condition persisted', '|used|' in row, row)
    check('PTA persisted', 'pta_approved' in row, row)
    check('Colors persisted', row.endswith('Blue,Graphite'), row)

    # 7. toggle visibility
    before_active = psql(f"select is_active from variants where id='{VARIANT_ID}'")
    tap('active-switch'); time.sleep(2)
    after_active = psql(f"select is_active from variants where id='{VARIANT_ID}'")
    check('Visibility toggle persisted', before_active != after_active, f'{before_active}->{after_active}')

    # 8. image upload
    img_before = psql(f"select count(*) from variant_images where variant_id='{VARIANT_ID}'")
    # push an image into the gallery and scan it
    subprocess.run([ADB, 'push', IMG, '/sdcard/Pictures/sc_test.jpg'], capture_output=True, text=True)
    shell('am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Pictures/sc_test.jpg >/dev/null 2>&1')
    time.sleep(1.5)
    uploaded_ui = False
    # Tag the upload with a specific color (color-specific image, like the web app).
    tapped_color = tap('upload-color-Blue', tries=3)
    if tap('upload-image-button', tries=8):
        time.sleep(3)
        # Google Photo Picker: tap the first photo (content-desc "Photo taken on ..."),
        # then confirm with the "Done" button.
        c = find(dump(), desc_sub='Photo taken on')
        if c:
            tap_xy(*c); time.sleep(2)
            done = find(dump(), text='Done') or find(dump(), desc_sub='Done')
            if done:
                tap_xy(*done)
            uploaded_ui = True
    # allow time for the Cloudinary round-trip + DB insert
    time.sleep(10)
    img_after = psql(f"select count(*) from variant_images where variant_id='{VARIANT_ID}'")
    check('Image uploaded + row persisted', int(img_after) > int(img_before), f'{img_before}->{img_after} (ui={uploaded_ui})')
    last = psql(f"select coalesce(left(image_url,40),'')||'|'||coalesce(public_id,'')||'|'||coalesce(color,'<null>') from variant_images where variant_id='{VARIANT_ID}' order by created_at desc limit 1")
    check('Uploaded image is a Cloudinary URL', 'res.cloudinary.com' in last, last)
    check('Image tagged with selected color (Blue)', last.endswith('|Blue'), f'color={last.split("|")[-1]} (chip={bool(tapped_color)})')

    # 9. in-app persistence: go back to list and re-open, check fields reflect DB
    shell('input keyevent 4'); time.sleep(1.5)  # back to list
    reopened = tap(resid=f'variant-row-{VARIANT_ID}', tries=8) or tap(desc_sub='256 GB', tries=6)
    time.sleep(1.5)
    px = dump()
    shows_new = ('256' in px and ('Used' in px or 'used' in px))
    check('Re-opened detail reflects persisted values', shows_new)

    # 10. restore originals
    sg, cond, pta, price, act, cols = orig.split('|')
    colarr = '{' + ','.join(f'"{c}"' for c in cols.split(',') if c) + '}'
    pta_sql = 'null' if pta == '' else f"'{pta}'"
    psql(f"update variants set storage_gb={sg}, condition='{cond}', pta_status={pta_sql}, selling_price={price}, is_active={act}, available_colors='{colarr}' where id='{VARIANT_ID}'")
    psql(f"update products set selling_price={price} where variant_id='{VARIANT_ID}' and product_type='phone'")
    psql(f"delete from variant_images where variant_id='{VARIANT_ID}' and created_at > now() - interval '1 hour'")
    print('RESTORED to:', psql(f"select storage_gb||'|'||condition||'|'||coalesce(pta_status,'')||'|'||selling_price from variants where id='{VARIANT_ID}'"))

    npass = sum(1 for _, ok, _ in results if ok)
    nfail = sum(1 for _, ok, _ in results if not ok)
    print(f'\n=== SUMMARY: PASS {npass} / FAIL {nfail} ===')
    sys.exit(1 if nfail else 0)

if __name__ == '__main__':
    main()
