import math
from PIL import Image, ImageSequence

gif_path = '218fc872735831.5bf1e45999c40.gif'
im = Image.open(gif_path)

# Bounding box crop coordinates to center the character/subject
w, h = im.size
crop_box = (540, 160, 1380, 960) # ~ 840x800 box

target_r, target_g, target_b = 255, 217, 64

frames = []
durations = []

# Process each frame
for i, frame in enumerate(ImageSequence.Iterator(im)):
    # Get frame duration
    duration = frame.info.get('duration', 40)
    durations.append(duration)

    rgba = frame.convert('RGBA')
    cropped = rgba.crop(crop_box)
    
    # Resize to 280x280 for lightweight, sharp performance
    resized = cropped.resize((280, 280), Image.Resampling.LANCZOS)
    
    # Process pixels for transparent background
    pixels = resized.load()
    rw, rh = resized.size
    
    for y in range(rh):
        for x in range(rw):
            r, g, b, a = pixels[x, y]
            # Euclidean distance to yellow background color
            dist = math.sqrt((r - target_r)**2 + (g - target_g)**2 + (b - target_b)**2)
            
            if dist < 45:
                # Fully transparent
                pixels[x, y] = (r, g, b, 0)
            elif dist < 80:
                # Feather edge anti-aliasing
                alpha = int(255 * (dist - 45) / 35)
                pixels[x, y] = (r, g, b, min(a, alpha))

    frames.append(resized)

print(f"Processed {len(frames)} frames.")

# Save animated WebP with transparency
webp_out = 'public/loading.webp'
frames[0].save(
    webp_out,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    transparency=0,
    disposition=2
)
print(f"Saved {webp_out}")

# Save GIF with transparency using disposal mode 2
gif_out = 'public/loading.gif'
frames[0].save(
    gif_out,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    transparency=0,
    disposition=2
)
print(f"Saved {gif_out}")
