import os
import sys
import numpy as np
from PIL import Image, ImageSequence

gif_path = r'C:\Users\Consultor\Desktop\Nova pasta\wger-master\218fc872735831.5bf1e45999c40.gif'
public_dir = r'C:\Users\Consultor\Desktop\Nova pasta\wger-master\public'
os.makedirs(public_dir, exist_ok=True)

im = Image.open(gif_path)
bg_color = np.array([255, 217, 64], dtype=np.float32) # #FFD940

frames_rgba = []
min_x, min_y, max_x, max_y = 1920, 1080, 0, 0

print("Processing 121 frames...")
for frame in ImageSequence.Iterator(im):
    rgba = frame.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    
    rgb = arr[:, :, :3]
    dist = np.sqrt(np.sum((rgb - bg_color) ** 2, axis=2))
    
    # Soft alpha threshold
    alpha = np.clip((dist - 20.0) / (50.0 - 20.0), 0.0, 1.0) * 255.0
    arr[:, :, 3] = alpha
    
    result_img = Image.fromarray(arr.astype(np.uint8), mode="RGBA")
    frames_rgba.append(result_img)

    alpha_mask = arr[:, :, 3] > 30
    if np.any(alpha_mask):
        y_indices, x_indices = np.where(alpha_mask)
        min_x = min(min_x, np.min(x_indices))
        max_x = max(max_x, np.max(x_indices))
        min_y = min(min_y, np.min(y_indices))
        max_y = max(max_y, np.max(y_indices))

padding = 15
min_x = max(0, min_x - padding)
min_y = max(0, min_y - padding)
max_x = min(1920, max_x + padding)
max_y = min(1080, max_y + padding)

target_size = (180, 180)
cropped_frames = []

for frame in frames_rgba:
    cropped = frame.crop((min_x, min_y, max_x, max_y))
    resized = cropped.resize(target_size, Image.Resampling.LANCZOS)
    cropped_frames.append(resized)

# Save WebP
webp_path = os.path.join(public_dir, 'loading.webp')
cropped_frames[0].save(
    webp_path,
    save_all=True,
    append_images=cropped_frames[1:],
    duration=im.info.get('duration', 40),
    loop=0,
    quality=80,
    method=4,
    format='WEBP',
    transparency=True
)

# Save transparent GIF
gif_frames = []
for f in cropped_frames:
    alpha = f.split()[3]
    mask = Image.eval(alpha, lambda a: 255 if a > 128 else 0)
    
    p_img = f.convert('RGB').convert('P', palette=Image.Palette.ADAPTIVE, colors=254)
    np_p = np.array(p_img)
    np_mask = np.array(mask) == 0
    np_p[np_mask] = 255
    
    final_p = Image.fromarray(np_p, mode='P')
    final_p.info['transparency'] = 255
    gif_frames.append(final_p)

gif_out_path = os.path.join(public_dir, 'loading.gif')
gif_frames[0].save(
    gif_out_path,
    save_all=True,
    append_images=gif_frames[1:],
    duration=im.info.get('duration', 40),
    loop=0,
    disposal=2,
    transparency=255,
    optimize=True
)

print(f"SUCCESS: Saved WebP: {webp_path}")
print(f"SUCCESS: Saved GIF: {gif_out_path}")
