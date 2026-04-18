"""
Import parsed DigiKhata bills into the legacy_bills table.

- Reuses the bill parser from parse_digikhata_bills.py
- Fetches customer_id mapping from local DB
- Normalizes phone numbers to 03xx format
- Generates SQL migration with INSERT statements
"""

import csv
import re
import subprocess
from datetime import datetime

from scripts.parse_digikhata_bills import parse_layout_text, process_entries, load_contacts
from scripts.import_customers import normalize_phone


def parse_date(date_str):
    """Convert '09 Feb 26' -> '2026-02-09'."""
    try:
        return datetime.strptime(date_str.strip(), "%d %b %y").strftime("%Y-%m-%d")
    except ValueError:
        return None


def fetch_customer_map(db_url):
    """Query customers table, return {name_lower: uuid} dict."""
    result = subprocess.run(
        ['psql', db_url, '-t', '-A', '-F', '|', '-c',
         'SELECT id, name FROM customers'],
        capture_output=True, text=True
    )

    customer_map = {}
    for line in result.stdout.strip().split('\n'):
        if '|' in line:
            parts = line.split('|', 1)
            uuid = parts[0].strip()
            name = parts[1].strip()
            customer_map[name] = uuid

    return customer_map


def escape_sql(text):
    """Escape single quotes for SQL strings."""
    if text is None:
        return None
    return text.replace("'", "''")


def sql_val(val):
    """Convert Python value to SQL literal."""
    if val is None or val == '':
        return 'NULL'
    if isinstance(val, bool):
        return 'TRUE' if val else 'FALSE'
    if isinstance(val, int):
        return str(val)
    return f"'{escape_sql(str(val))}'"


def generate_sql(bills, customer_map, output_path):
    """Generate SQL migration with INSERT statements for legacy_bills."""
    lines = []
    lines.append("-- Migration: Import DigiKhata legacy bills data")
    lines.append(f"-- {len(bills)} bills from DigiKhata PDF bill report")
    lines.append("")

    inserted = 0
    no_date = 0
    linked = 0

    for bill in bills:
        # Parse date
        bill_date = parse_date(bill['date'])
        if not bill_date:
            no_date += 1
            continue

        # Normalize phone
        phone = normalize_phone(bill.get('phone', ''))

        # Look up customer_id
        customer_id = customer_map.get(bill['customer_name'])
        if customer_id:
            linked += 1

        # Phone missing flag
        phone_missing = bool(bill['customer_name'] and not bill.get('phone'))

        lines.append(
            f"INSERT INTO legacy_bills "
            f"(row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, "
            f"brand, primary_product, all_products, qty, amount, "
            f"storage, imei, condition_notes, raw_details, severity, doubt_reasons) "
            f"VALUES ("
            f"{sql_val(bill.get('row_num'))}, "
            f"{sql_val(bill.get('bill_num'))}, "
            f"{sql_val(bill_date)}, "
            f"{sql_val(bill.get('customer_name'))}, "
            f"{sql_val(phone)}, "
            f"{sql_val(phone_missing)}, "
            f"{sql_val(customer_id)}, "
            f"{sql_val(bill.get('brand'))}, "
            f"{sql_val(bill.get('primary_product'))}, "
            f"{sql_val(bill.get('product_summary'))}, "
            f"{sql_val(bill.get('total_qty'))}, "
            f"{sql_val(bill.get('amount'))}, "
            f"{sql_val(bill.get('storage'))}, "
            f"{sql_val(bill.get('imei'))}, "
            f"{sql_val(bill.get('condition_notes'))}, "
            f"{sql_val(bill.get('raw_details'))}, "
            f"{sql_val(bill.get('severity', 'ok').upper())}, "
            f"{sql_val(bill.get('doubt_reasons'))}"
            f");"
        )
        inserted += 1

    lines.append("")
    lines.append(f"-- Inserted: {inserted} bills")
    lines.append(f"-- Linked to customers: {linked}")
    lines.append(f"-- Skipped (bad date): {no_date}")

    sql = '\n'.join(lines)
    with open(output_path, 'w') as f:
        f.write(sql)

    return inserted, linked, no_date


def main():
    db_url = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    layout_file = '/tmp/bill_report_layout.txt'
    contacts_file = '/Users/haris/Downloads/contacts.csv'
    migration_path = '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/backend/supabase/migrations/20260323000003_import_legacy_bills_data.sql'

    print("Loading contacts...")
    contacts = load_contacts(contacts_file)
    print(f"  {len(contacts)} name→phone mappings")

    print("Parsing bills...")
    entries = parse_layout_text(layout_file)
    bills = process_entries(entries, contacts)
    print(f"  {len(bills)} bills")

    print("Fetching customer IDs from local DB...")
    customer_map = fetch_customer_map(db_url)
    print(f"  {len(customer_map)} customers in DB")

    print("Generating migration...")
    inserted, linked, skipped = generate_sql(bills, customer_map, migration_path)

    print(f"\nDone!")
    print(f"  Inserted:  {inserted}")
    print(f"  Linked:    {linked}")
    print(f"  Skipped:   {skipped}")
    print(f"  Migration: {migration_path}")


if __name__ == '__main__':
    main()
