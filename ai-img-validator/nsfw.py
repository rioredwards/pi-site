"""Original Yahoo ONNX model, using maintained ONNX Runtime and Pillow.

Preprocessing adapted from Sector Labs opennsfw-standalone 0.0.6 (MIT).
The full copyright and permission notice ships at /models/LICENSE-opennsfw.
Model and preprocessing stay identical; the obsolete Pillow-pinning wrapper is removed.
"""
from io import BytesIO
import numpy as np
import onnxruntime
from PIL import Image


class OpenNSFWInferenceRunner:
    def __init__(self):
        options = onnxruntime.SessionOptions()
        options.intra_op_num_threads = 2
        self.model = onnxruntime.InferenceSession(
            "/models/open-nsfw.onnx", sess_options=options,
            providers=["CPUExecutionProvider"],
        )

    def infer(self, image: Image.Image) -> float:
        image = image.resize((256, 256), Image.Resampling.BILINEAR).crop((16, 16, 240, 240))
        with BytesIO() as buffer:
            image.save(buffer, format="JPEG")
            buffer.seek(0)
            with Image.open(buffer) as jpeg:
                pixels = np.asarray(jpeg, dtype=np.float32).copy()
        pixels = pixels[:, :, ::-1]
        pixels -= np.array([104, 117, 123], dtype=np.float32)
        result = self.model.run(None, {self.model.get_inputs()[0].name: pixels[None, ...]})
        return float(result[0][0][1])
