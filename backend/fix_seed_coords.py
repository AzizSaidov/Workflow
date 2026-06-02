"""
One-time script: update lat/lng for seed users that have NULL coordinates.
Safe to run — does NOT delete any data, only updates missing coordinates.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from users.models import User

SEED_COORDS = {
    "admin@workflow.com":      (38.56,  68.77),   # Dushanbe
    "timur@techcorp.tj":       (38.56,  68.77),   # Dushanbe
    "amina@greenleaf.com":     (41.30,  69.24),   # Tashkent
    "damir@fintech.kz":        (43.22,  76.85),   # Almaty
    "sofia@designstudio.de":   (52.52,  13.40),   # Berlin
    "alexei@dev.ru":           (55.75,  37.62),   # Moscow
    "zara@flutter.dev":        (41.30,  69.24),   # Tashkent
    "marco@ux.it":             (41.90,  12.50),   # Rome
    "aisha@data.kz":           (43.22,  76.85),   # Almaty
    "bekzod@mobile.uz":        (41.30,  69.24),   # Tashkent
    "diana@content.ru":        (55.75,  37.62),   # Moscow
}

def main():
    db = SessionLocal()
    updated = 0
    skipped = 0
    not_found = 0

    for email, (lat, lng) in SEED_COORDS.items():
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"  NOT FOUND: {email}")
            not_found += 1
            continue
        if user.latitude is not None and user.longitude is not None:
            print(f"  SKIP (already has coords): {email} → ({user.latitude}, {user.longitude})")
            skipped += 1
            continue
        user.latitude = lat
        user.longitude = lng
        print(f"  UPDATED: {email} → ({lat}, {lng})")
        updated += 1

    db.commit()
    db.close()
    print(f"\nDone: {updated} updated, {skipped} skipped, {not_found} not found.")

if __name__ == "__main__":
    main()
