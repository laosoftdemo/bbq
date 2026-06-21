"""
Build a printable PDF with one QR table-card per table.
Run AFTER generate_qr_codes.py (needs qr_codes/table_N.png files to exist).
Output: qr_codes/sindat_table_qr_cards.pdf
Layout: 2 columns x 3 rows per A4 page, fold-able as a table tent.
"""
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

NUM_TABLES = 10
QR_DIR = "qr_codes"
OUTPUT_PATH = os.path.join(QR_DIR, "sindat_table_qr_cards.pdf")

# Register Noto Sans Lao so Lao script renders correctly (default PDF fonts have no Lao glyphs)
FONT_DIR = "fonts"
pdfmetrics.registerFont(TTFont("NotoSansLao", os.path.join(FONT_DIR, "NotoSansLao-Regular.ttf")))
pdfmetrics.registerFont(TTFont("NotoSansLao-Bold", os.path.join(FONT_DIR, "NotoSansLao-Bold.ttf")))

PAGE_W, PAGE_H = A4
COLS, ROWS = 2, 3
CARD_W = PAGE_W / COLS
CARD_H = PAGE_H / ROWS
QR_SIZE = 55 * mm

c = canvas.Canvas(OUTPUT_PATH, pagesize=A4)

for i in range(NUM_TABLES):
    table_num = i + 1
    qr_path = os.path.join(QR_DIR, f"table_{table_num}.png")
    if not os.path.exists(qr_path):
        continue

    col = i % COLS
    row = (i // COLS) % ROWS
    page_index = i // (COLS * ROWS)

    if i > 0 and i % (COLS * ROWS) == 0:
        c.showPage()

    x0 = col * CARD_W
    y0 = PAGE_H - (row + 1) * CARD_H

    # Card border (cut/fold guide)
    c.setStrokeColorRGB(0.85, 0.85, 0.85)
    c.setDash(3, 3)
    c.rect(x0 + 4*mm, y0 + 4*mm, CARD_W - 8*mm, CARD_H - 8*mm)
    c.setDash()

    # Header — restaurant name
    c.setFillColorRGB(0.1, 0.1, 0.1)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(x0 + CARD_W/2, y0 + CARD_H - 14*mm, "Sindat BBQ")
    c.setFont("NotoSansLao", 9)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.drawCentredString(x0 + CARD_W/2, y0 + CARD_H - 19*mm, "Scan to Order \u00b7 \u0eaa\u0eb0\u0e81\u0e87\u0e09\u0eb2\u0e9a\u0eaa\u0eb1\u0ec8\u0e87\u0ec0\u0e84\u0eb7\u0ec8\u0ead\u0e87")

    # QR code, centered
    qr_x = x0 + (CARD_W - QR_SIZE) / 2
    qr_y = y0 + (CARD_H - QR_SIZE) / 2 - 2*mm
    c.drawImage(qr_path, qr_x, qr_y, width=QR_SIZE, height=QR_SIZE)

    # Table number, large, below QR
    c.setFillColorRGB(0.96, 0.45, 0.09)  # ember orange
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(x0 + CARD_W/2, y0 + 10*mm, f"Table {table_num}")
    c.setFont("NotoSansLao", 10)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.drawCentredString(x0 + CARD_W/2, y0 + 6*mm, f"\u0ec2\u0e95\u0eb0 {table_num}")

c.save()
print(f"PDF saved to {OUTPUT_PATH}")
