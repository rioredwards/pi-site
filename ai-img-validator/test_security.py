"""Run with python -m unittest test_security inside the validator image."""
from io import BytesIO
import struct
import unittest
from unittest.mock import patch
import zlib

from fastapi import HTTPException, UploadFile
from PIL import Image
import main


def png():
    data = BytesIO()
    Image.new("RGB", (2, 2)).save(data, "PNG")
    return data.getvalue()


class ImageBoundaryTests(unittest.TestCase):
    def test_decode_ignores_claimed_mime_and_requires_raster_bytes(self):
        for data in (b"<svg xmlns='http://www.w3.org/2000/svg'/>", b"not an image", png()[:30]):
            with self.assertRaises(HTTPException) as caught:
                main.decode_image(data)
            self.assertEqual(caught.exception.status_code, 400)
        self.assertEqual(main.decode_image(png()).mode, "RGB")

    def test_pixel_bomb_rejected_before_decoding(self):
        data = bytearray(png())
        data[16:24] = struct.pack(">II", 6000, 6000)
        data[29:33] = struct.pack(">I", zlib.crc32(data[12:29]))
        with self.assertRaises(HTTPException) as caught:
            main.decode_image(bytes(data))
        self.assertEqual(caught.exception.status_code, 400)

    def test_file_size_bound_and_cleanup(self):
        stream = BytesIO(b"x" * 5)
        with patch.multiple(main, runner=object(), dog_model=object(), preprocess=object(), MAX_FILE_BYTES=4):
            with self.assertRaises(HTTPException) as caught:
                main.analyze_image(UploadFile(file=stream))
        self.assertEqual(caught.exception.status_code, 413)
        self.assertTrue(stream.closed)

    def test_unavailable_models_fail_closed(self):
        with patch.object(main, "runner", None):
            with self.assertRaises(HTTPException) as caught:
                main.analyze_image(UploadFile(file=BytesIO(png())))
        self.assertEqual(caught.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
