"""Bounded raster validation with the original NSFW and ImageNet dog classifiers."""
from contextlib import asynccontextmanager
from io import BytesIO
import logging
import math
import warnings

from fastapi import FastAPI, File, UploadFile, HTTPException
from PIL import Image, UnidentifiedImageError
import torch
from torchvision import models
from nsfw import OpenNSFWInferenceRunner

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 25_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
warnings.simplefilter("error", Image.DecompressionBombWarning)
logger = logging.getLogger(__name__)
runner = None
dog_model = None
preprocess = None


@asynccontextmanager
async def lifespan(app):
    global runner, dog_model, preprocess
    torch.set_num_threads(2)
    runner = OpenNSFWInferenceRunner()
    weights = models.MobileNet_V2_Weights.DEFAULT
    dog_model = models.mobilenet_v2(weights=weights).eval()
    preprocess = weights.transforms()
    yield


app = FastAPI(title="NSFW + Dog Filter API", lifespan=lifespan, docs_url=None, redoc_url=None)


class BodyLimit:
    """Enforce the bound before multipart parsing can spool unbounded data."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        size = 0

        async def bounded_receive():
            nonlocal size
            message = await receive()
            size += len(message.get("body", b""))
            if size > MAX_FILE_BYTES + 1024 * 1024:
                raise HTTPException(413, "Image too large")
            return message

        await self.app(scope, bounded_receive, send)


app.add_middleware(BodyLimit)


def decode_image(data: bytes) -> Image.Image:
    try:
        with Image.open(BytesIO(data)) as image:
            if image.format not in {"JPEG", "PNG", "WEBP"} or getattr(image, "n_frames", 1) != 1:
                raise HTTPException(400, "Use a single JPEG, PNG or WebP image")
            if image.width * image.height > MAX_PIXELS:
                raise HTTPException(400, "Image dimensions too large")
            image.load()
            return image.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
        raise HTTPException(400, "Invalid image file") from error


@app.get("/")
def root():
    if runner is None or dog_model is None:
        raise HTTPException(503, "Models unavailable")
    return {"status": "ok", "nsfw_model_loaded": True, "dog_model_loaded": True}


@app.post("/analyze")
def analyze_image(file: UploadFile = File(...)):
    if runner is None or dog_model is None or preprocess is None:
        raise HTTPException(503, "Models unavailable")
    try:
        data = file.file.read(MAX_FILE_BYTES + 1)
        if not data or len(data) > MAX_FILE_BYTES:
            raise HTTPException(413 if data else 400, "Image size invalid")
        image = decode_image(data)
        nsfw_score = runner.infer(image)
        with torch.inference_mode():
            probs = torch.softmax(dog_model(preprocess(image).unsqueeze(0)), dim=1)[0]
        dog_prob = float(probs[151:269].sum().item())
        if not all(math.isfinite(n) and 0 <= n <= 1 for n in (nsfw_score, dog_prob)):
            raise RuntimeError("Invalid classifier result")
        return {
            "nsfw_score": round(nsfw_score, 4), "is_nsfw": nsfw_score > 0.5,
            "dog_probability": round(dog_prob, 4), "is_dog": dog_prob > 0.2,
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("Image classifier failed")
        raise HTTPException(503, "Image analysis unavailable") from None
    finally:
        file.file.close()
