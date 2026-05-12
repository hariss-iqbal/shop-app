#!/usr/bin/env python3
"""
Remove background from phone product images using flood-fill from edges.
Similar approach to what was used for Pixel 10 Pro XL images.
BG_TOLERANCE=35 controls how similar a pixel must be to the edge color to be removed.
"""

import os
import sys
from collections import deque
from PIL import Image

BG_TOLERANCE = 35
INPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'phones')
OUTPUT_EXT = '.webp'  # Save as webp for web optimization


def color_distance(c1, c2):
    """Euclidean distance between two RGB colors."""
    return sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])) ** 0.5


def remove_background(img, tolerance=BG_TOLERANCE):
    """
    Flood-fill from all edge pixels to mark background as transparent.
    Uses a queue-based BFS approach.
    """
    # Convert to RGBA if needed
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    width, height = img.size
    pixels = img.load()

    # Create a visited mask
    visited = [[False] * height for _ in range(width)]
    transparent = [[False] * width for _ in range(height)]

    # Queue for BFS - start from all edge pixels
    queue = deque()

    # Sample the background color from corners
    corner_colors = []
    for x, y in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]:
        r, g, b, a = pixels[x, y]
        corner_colors.append((r, g, b))

    # Average corner color as reference background
    avg_bg = tuple(int(sum(c[i] for c in corner_colors) / len(corner_colors)) for i in range(3))

    # Add all edge pixels that are close to the background color
    for x in range(width):
        for y in [0, height - 1]:
            r, g, b, a = pixels[x, y]
            if color_distance((r, g, b), avg_bg) <= tolerance:
                if not visited[x][y]:
                    visited[x][y] = True
                    transparent[y][x] = True
                    queue.append((x, y))

    for y in range(height):
        for x in [0, width - 1]:
            r, g, b, a = pixels[x, y]
            if color_distance((r, g, b), avg_bg) <= tolerance:
                if not visited[x][y]:
                    visited[x][y] = True
                    transparent[y][x] = True
                    queue.append((x, y))

    # BFS flood fill
    total_marked = 0
    while queue:
        x, y = queue.popleft()
        total_marked += 1

        # Make this pixel transparent
        r, g, b, a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)

        # Check 4 neighbors
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and not visited[nx][ny]:
                nr, ng, nb, na = pixels[nx, ny]
                if color_distance((nr, ng, nb), avg_bg) <= tolerance:
                    visited[nx][ny] = True
                    transparent[ny][nx] = True
                    queue.append((nx, ny))

    return img, total_marked


def process_file(filepath):
    """Process a single image file: remove background and save as webp."""
    filename = os.path.basename(filepath)
    name, ext = os.path.splitext(filename)

    # Skip files that are already processed (have -nobg suffix or are webp with transparency)
    if '-nobg' in name:
        return

    # Only process specific phone images
    prefixes = ['samsung-s25-ultra-', 'iphone-16-pro-max-', 'oneplus-13-']
    if not any(name.startswith(p) for p in prefixes):
        return

    print(f"Processing: {filename}")

    img = Image.open(filepath)
    original_size = img.size
    print(f"  Original: {original_size} {img.mode}")

    # Remove background
    img, marked = remove_background(img)
    print(f"  Pixels made transparent: {marked}")

    # Save as webp with transparency
    out_name = f"{name}.webp"
    out_path = os.path.join(INPUT_DIR, out_name)
    img.save(out_path, 'WEBP', quality=90)
    out_size = os.path.getsize(out_path)
    print(f"  Saved: {out_name} ({out_size} bytes)")

    # Remove original file
    os.remove(filepath)
    print(f"  Removed original: {filename}")

    return out_path


def main():
    print(f"Input directory: {INPUT_DIR}")
    print(f"BG_TOLERANCE: {BG_TOLERANCE}")
    print()

    if not os.path.exists(INPUT_DIR):
        print(f"Error: Directory {INPUT_DIR} does not exist")
        sys.exit(1)

    # Get all image files
    files = []
    for f in os.listdir(INPUT_DIR):
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            # Skip already processed webp files
            if f.lower().endswith('.webp') and not any(f.startswith(p) for p in ['samsung', 'iphone', 'oneplus']):
                continue
            files.append(os.path.join(INPUT_DIR, f))

    files.sort()
    print(f"Found {len(files)} files to process\n")

    for filepath in files:
        try:
            process_file(filepath)
        except Exception as e:
            print(f"  ERROR: {e}")
        print()

    print("Done!")


if __name__ == '__main__':
    main()
