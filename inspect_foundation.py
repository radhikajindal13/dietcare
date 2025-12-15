# inspect_foundation.py
import pandas as pd
from pathlib import Path

PATH = Path("datasets/nutrition/foundation_food.csv")

df = pd.read_csv(PATH, dtype=str, keep_default_na=False)
print("Rows:", len(df))
print("Columns:")
for c in df.columns:
    print("  -", c)
print("\nShowing up to 5 non-empty values from likely text columns:\n")

# pick columns that look textual
candidates = [c for c in df.columns if any(k in c.lower() for k in ("desc", "name", "display", "label", "description"))]
# if none found, pick other text-like columns (lengthy content)
if not candidates:
    # heuristics: columns with string length avg > 10
    avg_len = {c: df[c].astype(str).map(len).mean() for c in df.columns}
    sorted_cols = sorted(avg_len.items(), key=lambda x: -x[1])
    candidates = [c for c, _ in sorted_cols[:6]]

print("Candidate text columns to inspect:")
for c in candidates:
    print(f"\n== Column: {c} ==")
    sample = df[df[c].astype(bool)][c].unique()[:5]
    for s in sample:
        print("  ", repr(s)[:200])
