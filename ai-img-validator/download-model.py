"""Extract only the original model from its hash-verified release, never install it."""
import hashlib
import io
from pathlib import Path
import urllib.request
import zipfile

URL = "https://files.pythonhosted.org/packages/fb/9e/a9b10a114931f52afff1e4b6af162b4f7cad59b01e02e54bd3e9ac67e6be/opennsfw_standalone-0.0.6-py3-none-any.whl"
SHA256 = "e3357078a9f18c40d5c254f1396f47dcd46a2fbc819138b81f72087e17bec259"
wheel = urllib.request.urlopen(URL, timeout=60).read()
if hashlib.sha256(wheel).hexdigest() != SHA256:
    raise RuntimeError("NSFW model release checksum mismatch")
with zipfile.ZipFile(io.BytesIO(wheel)) as archive:
    Path("/models/open-nsfw.onnx").write_bytes(archive.read("opennsfw_standalone/open-nsfw.onnx"))
    Path("/models/LICENSE-opennsfw").write_bytes(archive.read("opennsfw_standalone-0.0.6.dist-info/LICENSE"))
