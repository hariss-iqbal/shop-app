"""
Import unique customers from parsed DigiKhata bills into the shop-app database.

- Deduplicates by customer name
- Normalizes Pakistani phone numbers to 03xx format
- Assigns sequential placeholders (0000-001, 0000-002, ...) for missing phones
- Outputs SQL migration file
"""

import re
from scripts.parse_digikhata_bills import parse_layout_text, process_entries, load_contacts


def normalize_phone(phone):
    """Normalize Pakistani phone numbers to 03xx format."""
    if not phone:
        return ''

    # Strip spaces, dashes, dots
    phone = re.sub(r'[\s\-\.\(\)]', '', phone)

    # +92xxx → 0xxx
    if phone.startswith('+92'):
        phone = '0' + phone[3:]
    # 92xxx (without +) → 0xxx
    elif phone.startswith('92') and len(phone) > 10:
        phone = '0' + phone[2:]

    return phone


def build_unique_customers(bills):
    """Build deduplicated customer list from bills."""
    customers = {}  # name → phone

    for b in bills:
        name = b['customer_name']
        phone = b['phone']
        if not name:
            continue

        normalized = normalize_phone(phone)

        # Keep the first phone we find for each customer
        if name not in customers or (not customers[name] and normalized):
            customers[name] = normalized

    return customers


def generate_sql(customers, output_path):
    """Generate SQL migration to truncate and import customers."""
    lines = []
    lines.append("-- Migration: Import DigiKhata customers")
    lines.append("-- Truncates existing customers and sales, then inserts unique customers.")
    lines.append("-- Phone numbers normalized to 03xx format.")
    lines.append("-- Missing phones use sequential placeholders: 0000-001, 0000-002, ...")
    lines.append("")
    lines.append("-- Truncate existing data (sales first due to FK)")
    lines.append("TRUNCATE TABLE follow_up_payments CASCADE;")
    lines.append("TRUNCATE TABLE sale_payments CASCADE;")
    lines.append("TRUNCATE TABLE sale_discounts CASCADE;")
    lines.append("TRUNCATE TABLE receipt_items CASCADE;")
    lines.append("TRUNCATE TABLE receipt_payments CASCADE;")
    lines.append("TRUNCATE TABLE receipts CASCADE;")
    lines.append("TRUNCATE TABLE refund_items CASCADE;")
    lines.append("TRUNCATE TABLE refunds CASCADE;")
    lines.append("TRUNCATE TABLE inventory_deduction_logs CASCADE;")
    lines.append("TRUNCATE TABLE sales CASCADE;")
    lines.append("TRUNCATE TABLE customer_loyalty CASCADE;")
    lines.append("TRUNCATE TABLE loyalty_transactions CASCADE;")
    lines.append("TRUNCATE TABLE customers CASCADE;")
    lines.append("")
    lines.append("-- Insert customers")

    placeholder_counter = 0
    total = 0
    with_phone = 0
    without_phone = 0

    for name in sorted(customers.keys()):
        phone = customers[name]

        if not phone:
            placeholder_counter += 1
            phone = f"0000-{placeholder_counter:03d}"
            without_phone += 1
        else:
            with_phone += 1

        # Escape single quotes in name
        escaped_name = name.replace("'", "''")
        escaped_phone = phone.replace("'", "''")

        lines.append(
            f"INSERT INTO customers (phone, name) "
            f"VALUES ('{escaped_phone}', '{escaped_name}') "
            f"ON CONFLICT (phone) DO NOTHING;"
        )
        total += 1

    lines.append("")
    lines.append(f"-- Total: {total} customers ({with_phone} with phone, {without_phone} with placeholder)")

    sql = '\n'.join(lines)

    with open(output_path, 'w') as f:
        f.write(sql)

    return total, with_phone, without_phone


def main():
    layout_file = '/tmp/bill_report_layout.txt'
    contacts_file = '/Users/haris/Downloads/contacts.csv'
    migration_path = '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/backend/supabase/migrations/20260323000001_import_digikhata_customers.sql'

    print("Loading contacts...")
    contacts = load_contacts(contacts_file)
    print(f"  {len(contacts)} name→phone mappings")

    print("Parsing bills...")
    entries = parse_layout_text(layout_file)
    bills = process_entries(entries, contacts)
    print(f"  {len(bills)} bills")

    print("Building unique customer list...")
    customers = build_unique_customers(bills)
    print(f"  {len(customers)} unique customers")

    print(f"Generating migration...")
    total, with_phone, without_phone = generate_sql(customers, migration_path)

    print(f"\nDone!")
    print(f"  Total customers:  {total}")
    print(f"  With phone:       {with_phone}")
    print(f"  Placeholder phone: {without_phone}")
    print(f"  Migration:        {migration_path}")
    print(f"\nRun: supabase migration up")


if __name__ == '__main__':
    main()
