"""
Generate QR codes for each Sindat BBQ table.
Run: python generate_qr_codes.py
Outputs: qr_codes/table_1.png, qr_codes/table_2.png, ...
"""
import qrcode
import os

# ─── CONFIGURE THESE ───
BASE_URL = "https://bbq-os8.vercel.app"   # ← Sindat BBQ live URL
NUM_TABLES = 10                        # ← match this to your `tables` rows
OUTPUT_DIR = "qr_codes"
# ────────────────────────

os.makedirs(OUTPUT_DIR, exist_ok=True)

for table_num in range(1, NUM_TABLES + 1):
    url = f"{BASE_URL}/menu?table={table_num}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1a1a1a", back_color="white")
    out_path = os.path.join(OUTPUT_DIR, f"table_{table_num}.png")
    img.save(out_path)
    print(f"Table {table_num} → {out_path}  ({url})")

print(f"\nDone! {NUM_TABLES} QR codes saved to ./{OUTPUT_DIR}/")
