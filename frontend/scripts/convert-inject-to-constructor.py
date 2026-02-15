#!/usr/bin/env python3
"""
Convert Angular inject() field declarations to constructor-based DI.

Transforms class fields like:
    private foo = inject(FooService);
    protected readonly bar = inject(BarService);
    baz = inject(BazService);

Into constructor parameters:
    constructor(
        private foo: FooService,
        protected readonly bar: BarService,
        public baz: BazService
    ) { }

Handles:
- Multiple classes per file (e.g., directives)
- Existing constructors with bodies (merges params, keeps body)
- Dependent field initializers (they work because TS constructor params init before fields)
- Cleaning up 'inject' from @angular/core imports

Skips:
- Functional inject() (guards, interceptors, factory functions)
- Test/spec files
"""

import re
import os
import glob
import sys

BASE = '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/frontend/src'

# Files to skip (functional inject, not class-based)
SKIP_FILES = {
    'app.config.ts',
    'auth.guard.ts',
    'role.guard.ts',
    'error.interceptor.ts',
}

# Pattern for class field inject() declarations
INJECT_RE = re.compile(
    r'^(\s+)'                                      # group 1: indentation
    r'(?:(private|protected|public)\s+)?'          # group 2: access modifier
    r'(readonly\s+)?'                              # group 3: readonly keyword
    r'(\w+)'                                       # group 4: field name
    r'(?:\s*:\s*[^=;]+)?'                          # optional type annotation (ignored)
    r'\s*=\s*inject\((\w+(?:<[^>]+>)?)\)\s*;'     # group 5: injected type (with optional generic)
    r'\s*$'
)


def find_class_boundaries(lines):
    """Find all class declarations and their brace boundaries.
    Returns list of (class_start_line, open_brace_line, close_brace_line).
    """
    classes = []
    for i, line in enumerate(lines):
        if re.match(r'^(?:export\s+)?(?:abstract\s+)?class\s+\w+', line):
            # Find the opening brace
            brace_line = None
            for j in range(i, min(i + 5, len(lines))):
                if '{' in lines[j]:
                    brace_line = j
                    break
            if brace_line is None:
                continue

            # Find matching closing brace
            depth = 0
            close_line = None
            for j in range(brace_line, len(lines)):
                depth += lines[j].count('{') - lines[j].count('}')
                if depth == 0:
                    close_line = j
                    break

            if close_line is not None:
                classes.append((i, brace_line, close_line))

    return classes


def find_inject_fields_in_range(lines, start, end):
    """Find inject() field declarations within a line range."""
    fields = []
    for i in range(start, end + 1):
        m = INJECT_RE.match(lines[i])
        if m:
            fields.append({
                'idx': i,
                'indent': m.group(1),
                'access': m.group(2) or '',
                'readonly': bool(m.group(3)),
                'name': m.group(4),
                'service': m.group(5),
            })
    return fields


def find_constructor_in_range(lines, start, end):
    """Find constructor within a class range.
    Returns (ctor_start, ctor_end) or None.
    """
    for i in range(start, end + 1):
        if re.match(r'\s+constructor\s*\(', lines[i]):
            # Find end by brace matching
            depth = 0
            found = False
            for j in range(i, end + 1):
                for ch in lines[j]:
                    if ch == '{':
                        depth += 1
                        found = True
                    elif ch == '}':
                        depth -= 1
                if found and depth == 0:
                    return (i, j)
            return (i, i)
    return None


def extract_ctor_params(lines, ctor_start, ctor_end):
    """Extract existing constructor parameters as list of strings."""
    full = '\n'.join(lines[ctor_start:ctor_end + 1])

    # Find content between first ( and matching )
    depth = 0
    ps = pe = None
    for i, c in enumerate(full):
        if c == '(':
            depth += 1
            if ps is None:
                ps = i
        elif c == ')':
            depth -= 1
            if depth == 0:
                pe = i
                break

    if ps is None or pe is None:
        return []

    text = full[ps + 1:pe].strip()
    if not text:
        return []

    # Split by comma, respecting generics/nested brackets
    params = []
    depth = 0
    current = ''
    for c in text:
        if c in '(<[':
            depth += 1
        elif c in ')>]':
            depth -= 1
        if c == ',' and depth == 0:
            if current.strip():
                params.append(current.strip())
            current = ''
        else:
            current += c
    if current.strip():
        params.append(current.strip())

    return params


def extract_ctor_body_lines(lines, ctor_start, ctor_end):
    """Extract constructor body lines (between { and })."""
    full = '\n'.join(lines[ctor_start:ctor_end + 1])

    # Find { after closing paren
    paren_depth = 0
    brace_pos = None
    for i, c in enumerate(full):
        if c == '(':
            paren_depth += 1
        elif c == ')':
            paren_depth -= 1
        elif c == '{' and paren_depth == 0:
            brace_pos = i
            break

    if brace_pos is None:
        return []

    # Find matching }
    depth = 0
    end_pos = None
    for i in range(brace_pos, len(full)):
        if full[i] == '{':
            depth += 1
        elif full[i] == '}':
            depth -= 1
            if depth == 0:
                end_pos = i
                break

    if end_pos is None:
        return []

    body = full[brace_pos + 1:end_pos]
    body_lines = body.split('\n')

    # Trim leading/trailing empty lines
    while body_lines and not body_lines[0].strip():
        body_lines.pop(0)
    while body_lines and not body_lines[-1].strip():
        body_lines.pop()

    return body_lines


def build_ctor_string(inject_params, existing_params, body_lines, indent):
    """Build the new constructor string."""
    all_params = inject_params + existing_params
    pi = indent + '  '  # parameter indent

    if not all_params and not body_lines:
        return f"{indent}constructor() {{ }}"

    if len(all_params) == 1 and not body_lines:
        return f"{indent}constructor({all_params[0]}) {{ }}"

    # Multi-line params
    param_lines = []
    for i, p in enumerate(all_params):
        comma = ',' if i < len(all_params) - 1 else ''
        param_lines.append(f"{pi}{p}{comma}")

    params_block = '\n'.join(param_lines)

    if not body_lines:
        return f"{indent}constructor(\n{params_block}\n{indent}) {{ }}"
    else:
        body_block = '\n'.join(body_lines)
        return f"{indent}constructor(\n{params_block}\n{indent}) {{\n{body_block}\n{indent}}}"


def process_file(filepath):
    """Process a single file. Returns (changed, message)."""
    with open(filepath, 'r') as f:
        content = f.read()

    lines = content.split('\n')

    # Find all classes
    classes = find_class_boundaries(lines)
    if not classes:
        return False, "No classes found"

    # Collect all changes needed
    lines_to_remove = set()
    replacements = {}  # line_idx -> replacement string (for constructor)
    ctor_ranges_to_remove = set()

    any_changes = False

    for cls_start, cls_open, cls_close in classes:
        fields = find_inject_fields_in_range(lines, cls_open, cls_close)
        if not fields:
            continue

        any_changes = True
        member_indent = fields[0]['indent']

        # Build inject params
        inject_params = []
        for f in fields:
            access = f['access'] if f['access'] else 'public'
            readonly = 'readonly ' if f['readonly'] else ''
            inject_params.append(f"{access} {readonly}{f['name']}: {f['service']}")

        # Mark inject lines for removal
        for f in fields:
            lines_to_remove.add(f['idx'])

        # Find existing constructor
        ctor_range = find_constructor_in_range(lines, cls_open, cls_close)

        existing_params = []
        body_lines = []

        if ctor_range:
            existing_params = extract_ctor_params(lines, ctor_range[0], ctor_range[1])
            body_lines = extract_ctor_body_lines(lines, ctor_range[0], ctor_range[1])
            # Mark constructor lines for removal
            for i in range(ctor_range[0], ctor_range[1] + 1):
                ctor_ranges_to_remove.add(i)
            # Place new constructor at old constructor position
            new_ctor = build_ctor_string(inject_params, existing_params, body_lines, member_indent)
            replacements[ctor_range[0]] = new_ctor
        else:
            # No existing constructor - insert at first inject field position
            new_ctor = build_ctor_string(inject_params, existing_params, body_lines, member_indent)
            replacements[fields[0]['idx']] = new_ctor

    if not any_changes:
        return False, "No inject fields in classes"

    # Rebuild file content
    new_lines = []
    for i, line in enumerate(lines):
        if i in lines_to_remove and i not in replacements:
            continue
        if i in ctor_ranges_to_remove and i not in replacements:
            continue
        if i in replacements:
            new_lines.append(replacements[i])
            continue
        new_lines.append(line)

    result = '\n'.join(new_lines)

    # Clean up 'inject' from @angular/core import if no longer used
    if 'inject(' not in result and 'inject,' not in result.split('inject(')[0] if 'inject(' in content else True:
        # Check more carefully if inject is still used
        if not re.search(r'\binject\s*\(', result) and not re.search(r'\binject\s*,\s*\w', result.split("'@angular/core'")[0] if "'@angular/core'" in result else ''):
            result = _remove_inject_from_import(result)

    # Clean up consecutive blank lines (max 2)
    result = re.sub(r'\n{3,}', '\n\n', result)

    with open(filepath, 'w') as f:
        f.write(result)

    return True, f"OK"


def _remove_inject_from_import(content):
    """Remove 'inject' from @angular/core import statement."""
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


def main():
    # Find all .ts files with inject()
    all_files = glob.glob(os.path.join(BASE, '**/*.ts'), recursive=True)

    # Filter to files containing inject()
    candidate_files = []
    for fp in sorted(all_files):
        basename = os.path.basename(fp)

        # Skip test files
        if '.spec.' in basename or '.test.' in basename:
            continue

        # Skip known functional-inject files
        if basename in SKIP_FILES:
            continue

        # Check if file actually contains inject()
        with open(fp, 'r') as f:
            content = f.read()
        if '= inject(' not in content:
            continue

        candidate_files.append(fp)

    print(f"Found {len(candidate_files)} files to process\n")

    converted = 0
    skipped = 0
    errors = []

    for filepath in candidate_files:
        rel = os.path.relpath(filepath, BASE)
        try:
            changed, msg = process_file(filepath)
            if changed:
                converted += 1
                print(f"  [OK] {rel}")
            else:
                skipped += 1
                print(f"  [SKIP] {rel}: {msg}")
        except Exception as e:
            errors.append((rel, str(e)))
            print(f"  [ERR] {rel}: {e}")

    print(f"\nResults:")
    print(f"  Converted: {converted}")
    print(f"  Skipped:   {skipped}")
    print(f"  Errors:    {len(errors)}")

    if errors:
        print("\nError details:")
        for rel, err in errors:
            print(f"  {rel}: {err}")

    return 0 if not errors else 1


if __name__ == '__main__':
    sys.exit(main())
