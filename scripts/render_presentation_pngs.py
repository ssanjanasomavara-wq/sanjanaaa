from PIL import Image, ImageDraw, ImageFont
import os

OUT_DIR = 'mockups/screens'
os.makedirs(OUT_DIR, exist_ok=True)

W, H = 1200, 800
scale = 2
img = Image.new('RGB', (W*scale, H*scale), '#FFF8F3')
d = ImageDraw.Draw(img)
font = ImageFont.load_default()

# Draw header
d.text((40*scale,30*scale), 'Find the Calm — Visual Update', fill='#1F2B3A', font=font)
d.text((40*scale,60*scale), 'Warmer palette applied to mockup and prototype.', fill='#6b5a56', font=font)

# Draw frames as three panels
panel_w = (W - 60) / 3
panel_h = 420
px = 20
py = 120
colors = ['#fffaf6', '#fffaf6', '#fffaf6']
accent = '#E07A5F'
muted = '#8A6F6B'

for i in range(3):
    x = int((px + (panel_w + 10)*i)*scale)
    y = int(py*scale)
    w = int(panel_w*scale)
    h = int(panel_h*scale)
    # panel bg
    d.rectangle([x,y,x+w,y+h], fill=colors[i], outline='#F0E6E1')
    # caption
    cap = ['Mockup — Warmer','Prototype — Warmer','Design tokens'][i]
    d.text((x+18*scale,y+12*scale), cap, fill='#1F2B3A', font=font)
    # content
    if i == 0:
        # three small cards
        cx = x + 16*scale
        cy = y + 56*scale
        for j,label in enumerate(['Rain','Wind','Piano']):
            cw = int((panel_w-56)/3*scale)
            ch = int(80*scale)
            d.rectangle([cx,cy,cx+cw,cy+ch], fill='#FFF6F1', outline='#EFE0DB')
            d.text((cx+10*scale, cy+10*scale), label, fill=accent, font=font)
            cx += cw + 12*scale
    elif i == 1:
        cx = x + 12*scale
        cy = y + 56*scale
        for j,label in enumerate(['Rain','Wind','Piano']):
            cw = int((panel_w-56)/3*scale)
            ch = int(80*scale)
            col = '#fff6f3' if j==0 else '#fffaf6'
            d.rectangle([cx,cy,cx+cw,cy+ch], fill=col, outline='#EFE0DB')
            txtx = cx + 10*scale
            d.text((txtx, cy+10*scale), label, fill=accent if j==0 else '#6b5a56', font=font)
            cx += cw + 12*scale
        d.text((x+18*scale, y+160*scale), 'Tap a card to isolate • Haptics enabled', fill=muted, font=font)
    else:
        d.text((x+18*scale, y+56*scale), 'Colors', fill='#1F2B3A', font=font)
        # swatches
        swx = x + 18*scale
        swy = y + 90*scale
        d.rectangle([swx, swy, swx+42*scale, swy+42*scale], fill='#6A9FE6')
        d.text((swx+52*scale, swy+8*scale), 'Before\n#6A9FE6', fill=muted, font=font)
        swx2 = swx + 160*scale
        d.rectangle([swx2, swy, swx2+42*scale, swy+42*scale], fill=accent)
        d.text((swx2+52*scale, swy+8*scale), 'After\n#E07A5F', fill=muted, font=font)

# save full
full_path = os.path.join(OUT_DIR, 'presentation-full@2x.png')
img.save(full_path)
print('Saved', full_path)

# crop individual frames
for i in range(3):
    px = int((20 + (panel_w + 10)*i)*scale)
    py = int(120*scale)
    pw = int(panel_w*scale)
    ph = int(panel_h*scale)
    crop = img.crop((px,py,px+pw,py+ph))
    p = os.path.join(OUT_DIR, f'frame-{i+1}@2x.png')
    crop.save(p)
    print('Saved', p)
