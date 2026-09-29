import os
import math
from PIL import Image, ImageSequence, ImageOps

gif_path = '218fc872735831.5bf1e45999c40.gif'
im = Image.open(gif_path)

# Find bounding box of non-yellow elements to crop unnecessary empty space around subject
target_yellow = (255, 217, 64)

def is_yellow(r, g, b, tolerance=45):
    # Yellow background check
    return (abs(r - target_yellow[0]) < tolerance and
            abs(g - target_yellow[1]) < tolerance and
            abs(b - target_yellow[2]) < tolerance)

# Sample frame 10 to find content bounding box
f10 = ImageSequence.Iterator(im)[10].convert('RGBA')
w, h = f10.size

min_x, min_y, max_x, max_y = w, h, 0, 0
for x in range(0, w, 10):
    for y in range(0, h, 10):
        r, g, b, a = f10.getpixel((x, y))
        if not is_yellow(r, g, b):
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

print(f"Content bbox: min_x={min_x}, min_y={min_y}, max_x={max_x}, max_y={max_y}")

# Add padding
padding = 40
crop_box = (
    max(0, min_x - padding),
    max(0, min_y - padding),
    min(w, max_x + padding),
    min(h, max_y + padding)
)

print(f"Crop box: {crop_box}")
