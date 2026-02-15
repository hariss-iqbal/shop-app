#!/usr/bin/env python3
"""
Fix remaining issues after inject-to-constructor conversion:
1. Remove unused 'inject' from @angular/core imports
2. Fix InjectionToken params (PLATFORM_ID, DOCUMENT) to use @Inject() decorator
"""

import re
import os
import glob
import sys

BASE = '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/frontend/src'

# InjectionToken mappings: token_name -> (type_to_use, import_source)
INJECTION_TOKENS = {
    'PLATFORM_ID': ('Object', '@angular/core'),
    'DOCUMENT': ('Document', '@angular/common'),
}


def fix_unused_inject_import(content):
    """Remove 'inject' from @angular/core import if not used in code."""
    # Check if inject() is still used in the code
    if re.search(r'\binject\s*\(', content):
        return content

    # Remove inject from the import
    def replacer(m):
        before = m.group(1)
        imports_str = m.group(2)
        after = m.group(3)

        parts = [p.strip() for p in imports_str.split(',')]
        parts = [p for p in parts if p and p != 'inject']

        if not parts:
            return ''

        return f"{before} {', '.join(parts)} {after}"

    return re.sub(
        r"(import\s*\{)([^}]+)(\}\s*from\s*'@angular/core'\s*;)",
        replacer,
        content
    )


def fix_injection_tokens(content):
    """Fix InjectionToken parameters in constructors."""
    changed = False

    for token_name, (type_name, _import_source) in INJECTION_TOKENS.items():
        # Pattern: find constructor params like "private platformId: PLATFORM_ID"
        # Could be private/protected/public, with or without readonly
        pattern = re.compile(
            r'((?:private|protected|public)\s+(?:readonly\s+)?(\w+))\s*:\s*' + re.escape(token_name)
        )

        def replace_param(m):
            full_prefix = m.group(1)  # e.g., "private platformId" or "private readonly document"
            return f"@Inject({token_name}) {full_prefix}: {type_name}"

        new_content = pattern.sub(replace_param, content)
        if new_content != content:
            changed = True
            content = new_content

    if changed:
        # Ensure 'Inject' is in the @angular/core import
        if "'@angular/core'" in content:
            # Check if Inject is already imported
            core_import_match = re.search(
                r"import\s*\{([^}]+)\}\s*from\s*'@angular/core'\s*;",
                content
            )
            if core_import_match:
                imports = [p.strip() for p in core_import_match.group(1).split(',')]
                if 'Inject' not in imports:
                    # Add Inject to the import
                    imports.append('Inject')
                    imports.sort()
                    new_import = f"import {{ {', '.join(imports)} }} from '@angular/core';"
                    content = re.sub(
                        r"import\s*\{[^}]+\}\s*from\s*'@angular/core'\s*;",
                        new_import,
                        content
                    )

    return content


def remove_unused_token_imports(content):
    """Remove PLATFORM_ID/DOCUMENT from imports if they're only used in @Inject()."""
    for token_name, (_type_name, import_source) in INJECTION_TOKENS.items():
        if token_name not in content:
            continue

        # Count how many times the token is used outside of import/Inject
        # If it's only in the import line and @Inject(), we keep it
        # Actually, we need to keep the import because @Inject(PLATFORM_ID) references it
        # So we DON'T remove these imports
        pass

    return content


def process_file(filepath):
    with open(filepath, 'r') as f:
        original = f.read()

    content = original

    # Fix 1: Remove unused inject import
    content = fix_unused_inject_import(content)

    # Fix 2: Fix injection token constructor params
    content = fix_injection_tokens(content)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True

    return False


def main():
    all_files = glob.glob(os.path.join(BASE, '**/*.ts'), recursive=True)

    fixed = 0
    for filepath in sorted(all_files):
        basename = os.path.basename(filepath)
        if '.spec.' in basename or '.test.' in basename:
            continue

        try:
            if process_file(filepath):
                fixed += 1
                rel = os.path.relpath(filepath, BASE)
                print(f"  [FIXED] {rel}")
        except Exception as e:
            rel = os.path.relpath(filepath, BASE)
            print(f"  [ERR] {rel}: {e}")

    print(f"\nFixed {fixed} files")


if __name__ == '__main__':
    main()
