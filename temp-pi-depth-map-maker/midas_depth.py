import cv2
import torch
import numpy as np

# ============================================================================
# CONFIGURATION - Adjust these values to tweak depth map generation
# ============================================================================

# ---- File Paths ----
INPUT_PATH = "input.png"
OUTPUT_PATH_16 = "depth_16.png"   # 16-bit depth map (best for editing, more precision)
OUTPUT_PATH_8  = "depth_8.png"    # 8-bit depth map (convenient preview, smaller file)

# ---- Model Selection ----
# Options: "DPT_Large" (best quality, slowest), "DPT_Hybrid" (balanced), "MiDaS_small" (fastest, lower quality)
# DPT_Large: Highest accuracy, best for detailed images, requires more VRAM
# DPT_Hybrid: Good balance of speed and quality
# MiDaS_small: Fastest, lower accuracy, good for quick iterations
MODEL_TYPE = "DPT_Large"

# ---- Normalization Settings ----
# These percentiles control how depth values are normalized to 0-1 range
# Lower values (e.g., 1, 99) = more aggressive normalization, higher contrast, may lose detail
# Higher values (e.g., 5, 95) = gentler normalization, preserves more depth range
# Typical range: 1-10 for low percentile, 90-99 for high percentile
NORMALIZE_LOW_PERCENTILE = 10   # Bottom percentile to clip (removes outliers that are too close)
NORMALIZE_HIGH_PERCENTILE = 100  # Top percentile to clip (removes outliers that are too far)

# ---- Interpolation Settings ----
# How to resize the model's prediction to match input image size
# Options: "bicubic" (smooth, best quality), "bilinear" (faster, slightly less smooth), "nearest" (fastest, blocky)
INTERPOLATION_MODE = "bicubic"  # "bicubic", "bilinear", or "nearest"
INTERPOLATION_ALIGN_CORNERS = False  # Whether to align corners during interpolation (usually False for better results)

# ---- Alpha Channel Handling ----
# If your input image has transparency (alpha channel), how to handle it in depth map
USE_ALPHA_MASK = True  # If True, transparent areas will be set to 0 depth (far away)
# When True: Transparent pixels → depth = 0 (background appears far)
# When False: Alpha channel is ignored, depth calculated for all pixels

# ---- Normalization Safety ----
# Small epsilon value to prevent division by zero during normalization
# Increase if you get warnings, decrease if you want more precise normalization
# Typical range: 1e-10 to 1e-6
NORMALIZATION_EPSILON = 1e-8

# ---- Device Selection ----
# Automatically uses GPU if available, falls back to CPU
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
        mode=INTERPOLATION_MODE,
        align_corners=INTERPOLATION_ALIGN_CORNERS,
    ).squeeze()

depth = prediction.cpu().numpy()

# ---- normalize to 0..1 (robust) ----
# Robust percentiles reduce outliers that ruin contrast
lo, hi = np.percentile(depth, (NORMALIZE_LOW_PERCENTILE, NORMALIZE_HIGH_PERCENTILE))
depth_n = (depth - lo) / (hi - lo + NORMALIZATION_EPSILON)
depth_n = np.clip(depth_n, 0, 1)

# Apply alpha mask if enabled and alpha channel exists
if USE_ALPHA_MASK and alpha is not None:
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
