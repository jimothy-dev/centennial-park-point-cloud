import sys
from PIL import Image

src, dst, max_dim, quality = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src)
im = im.convert("RGB")
if max(im.size) > max_dim:
    ratio = max_dim / max(im.size)
    new_size = (max(1, round(im.width * ratio)), max(1, round(im.height * ratio)))
    im = im.resize(new_size, Image.LANCZOS)
im.save(dst, "JPEG", quality=quality, optimize=True)
