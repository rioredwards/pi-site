import cv2
import torch
import numpy as np

# ---- config ----
INPUT_PATH = "input.png"
OUTPUT_PATH_16 = "depth_16.png"   # best for editing
OUTPUT_PATH_8  = "depth_8.png"    # convenient preview

MODEL_TYPE = "DPT_Large"  # try: "DPT_Large", "DPT_Hybrid", "MiDaS_small"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ---- load model ----
midas = torch.hub.load("intel-isl/MiDaS", MODEL_TYPE)
midas.to(DEVICE).eval()

transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
if MODEL_TYPE in ("DPT_Large", "DPT_Hybrid"):
    transform = transforms.dpt_transform
else:
    transform = transforms.small_transform

# ---- read image ----
img_bgr = cv2.imread(INPUT_PATH, cv2.IMREAD_UNCHANGED)
if img_bgr is None:
    raise SystemExit(f"Could not read {INPUT_PATH}")

# Preserve alpha if present
alpha = None
if img_bgr.ndim == 3 and img_bgr.shape[2] == 4:
    alpha = img_bgr[:, :, 3]
    img_bgr = img_bgr[:, :, :3]

img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
input_batch = transform(img_rgb).to(DEVICE)

# ---- predict ----
with torch.no_grad():
    prediction = midas(input_batch)
    prediction = torch.nn.functional.interpolate(
        prediction.unsqueeze(1),
        size=img_rgb.shape[:2],
        mode="bicubic",
        align_corners=False,
    ).squeeze()

depth = prediction.cpu().numpy()

# ---- normalize to 0..1 (robust) ----
# Robust percentiles reduce outliers that ruin contrast
lo, hi = np.percentile(depth, (5, 95))
depth_n = (depth - lo) / (hi - lo + 1e-8)
depth_n = np.clip(depth_n, 0, 1)

# OPTIONAL: if you want background to be far when using transparent PNG
if alpha is not None:
    mask = (alpha > 0).astype(np.float32)
    # push transparent background to 0 depth (far)
    depth_n = depth_n * mask

# ---- export 16-bit (editing) ----
depth_16 = (depth_n * 65535).astype(np.uint16)
cv2.imwrite(OUTPUT_PATH_16, depth_16)

# ---- export 8-bit (preview) ----
depth_8 = (depth_n * 255).astype(np.uint8)
cv2.imwrite(OUTPUT_PATH_8, depth_8)

print("Wrote:", OUTPUT_PATH_16, OUTPUT_PATH_8)
