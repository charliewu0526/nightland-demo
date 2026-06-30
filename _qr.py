#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate a branded QR code (PNG) for the Nightland demo URL."""
import qrcode
from qrcode.constants import ERROR_CORRECT_M
from PIL import Image

URL = "https://charliewu0526.github.io/nightland-demo/"
OUT = "/Users/charliewu/.violoop/workspace/nightland_qr.png"

qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_M, box_size=14, border=3)
qr.add_data(URL)
qr.make(fit=True)
img = qr.make_image(fill_color="#0a0a0f", back_color="#ffffff").convert("RGB")
img.save(OUT)
print("QR saved:", OUT, img.size, "->", URL)
