#!/usr/bin/env python3
"""
fix_fdcs_exact.py

Reads:
  - data/ingredient_to_usda.csv
  - dataset/nutrition/foundation_food.csv

Finds rows in ingredient_to_usda where mapped_by is 'fuzzy_manual_review' or 'no_match'
and replaces fdc_id with the exact matching fdc_id from foundation_food (only when an
exact normalized description match exists and is unique).

Priority tokens: paneer, rice, dal, ghee, yogurt, oil, spices

Outputs:
  - data/ingredient_to_usda.backup.csv
  - data/ingredient_to_usda.fixed.csv
"""
from pathlib import Path
import pandas as pd
import re
import sys

# ---------- CONFIG ----------
ING_PATH = Path("data/ingredient_to_usda.csv")
FOUND_PATH = Path("datasets/nutrition/food.csv")

# possible ingredient text/source columns in ingredient file (checked in order)
ING_TEXT_CANDIDATES = ["ingredient_norm", "ingredient_raw", "ingredient", "fdc_description", "name"]

# required column names in ingredient file we will update/read
ING_FDC_COL = "fdc_id"
ING_MAPPED_BY_COL = "mapped_by"

# possible description columns in foundation file (checked in order)
FOUND_DESC_CANDIDATES = [
    "description", "fdc_description", "food_description", "food_name",
    "name", "display_name"
]
FOUND_FDC_COL = "fdc_id"

# priority tokens (normalized)
PRIORITY_TOKENS = ["paneer", "rice", "dal", "ghee", "yogurt", "yoghurt", "oil", "spice", "spices"]
# ------------------------------

def norm_text(s):
    """Normalize text: lowercase, remove punctuation, collapse whitespace."""
    if pd.isna(s):
        return ""
    s = str(s).strip().lower()
    s = re.sub(r"[“”\"'•·,\/\\\(\)\[\]\{\}\.:;?!@#\$%^&\*\+=<>`~]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def find_column(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    # fallback: any column name containing 'desc' or 'name' or 'ingredient'
    for c in df.columns:
        lc = c.lower()
        if any(k in lc for k in ("desc", "name", "ingredient")):
            return c
    return None

def load_data():
    if not ING_PATH.exists():
        print(f"Error: ingredient file not found at {ING_PATH}", file=sys.stderr)
        sys.exit(1)
    if not FOUND_PATH.exists():
        print(f"Error: foundation file not found at {FOUND_PATH}", file=sys.stderr)
        sys.exit(1)

    ing = pd.read_csv(ING_PATH, dtype=str, keep_default_na=False)
    found = pd.read_csv(FOUND_PATH, dtype=str, keep_default_na=False)
    return ing, found

def main():
    ing, found = load_data()
    print(f"Loaded ingredient file: {len(ing)} rows")
    print(f"Loaded foundation file: {len(found)} rows")

    # detect ingredient text column
    ing_text_col = find_column(ing, ING_TEXT_CANDIDATES)
    if ing_text_col is None:
        print("Error: couldn't find an ingredient text column in ingredient_to_usda.csv", file=sys.stderr)
        sys.exit(1)
    print(f"Using ingredient text column: '{ing_text_col}'")

    # normalized ingredient text
    ing["_norm_ing"] = ing[ing_text_col].apply(norm_text)

    # detect foundation description column
    found_desc_col = find_column(found, FOUND_DESC_CANDIDATES)
    if found_desc_col is None:
        print("Error: foundation file has no description-like column. Please use a file containing 'description' or 'food_name'.", file=sys.stderr)
        sys.exit(1)
    print(f"Using foundation description column: '{found_desc_col}'")

    # normalized foundation descriptions
    found["_norm_desc"] = found[found_desc_col].apply(norm_text)

    # Build mapping: normalized_description -> set(fdc_ids)
    desc_to_fdcs = {}
    for _, row in found.iterrows():
        nd = row["_norm_desc"]
        fid = row.get(FOUND_FDC_COL)
        if nd and fid:
            desc_to_fdcs.setdefault(nd, set()).add(fid)

    # Identify flagged rows
    flagged_mask = ing[ING_MAPPED_BY_COL].isin(["fuzzy_manual_review", "no_match"])
    flagged_indices = ing[flagged_mask].index.tolist()
    print(f"Rows flagged for fix: {len(flagged_indices)}")

    fixed = 0
    ambiguous = []  # (idx, ingredient_text, candidate_fdcs)
    not_found = []  # (idx, ingredient_text)

    # Priority pass
    print("Priority pass (paneer, rice, dal, ghee, yogurt, oil, spices)...")
    priority_norm = [norm_text(t) for t in PRIORITY_TOKENS]
    for idx in flagged_indices:
        if ing.at[idx, ING_MAPPED_BY_COL] not in ["fuzzy_manual_review", "no_match"]:
            continue
        n = ing.at[idx, "_norm_ing"]
        if any(tok in n for tok in priority_norm):
            if n in desc_to_fdcs:
                cands = sorted(desc_to_fdcs[n])
                if len(cands) == 1:
                    ing.at[idx, ING_FDC_COL] = cands[0]
                    ing.at[idx, ING_MAPPED_BY_COL] = "manual_exact_fix"
                    fixed += 1
                else:
                    ambiguous.append((idx, ing.at[idx, ing_text_col], cands))
            else:
                not_found.append((idx, ing.at[idx, ing_text_col]))

    # Exact-match pass for remaining flagged rows
    print("Exact-match pass for remaining flagged rows...")
    remaining_mask = ing[ING_MAPPED_BY_COL].isin(["fuzzy_manual_review", "no_match"])
    for idx, row in ing[remaining_mask].iterrows():
        n = row["_norm_ing"]
        if not n:
            not_found.append((idx, row.get(ing_text_col, "")))
            continue
        if n in desc_to_fdcs:
            cands = sorted(desc_to_fdcs[n])
            if len(cands) == 1:
                ing.at[idx, ING_FDC_COL] = cands[0]
                ing.at[idx, ING_MAPPED_BY_COL] = "manual_exact_fix"
                fixed += 1
            else:
                ambiguous.append((idx, row.get(ing_text_col, ""), cands))
        else:
            not_found.append((idx, row.get(ing_text_col, "")))

    # Summary
    print(f"Total fixed: {fixed}")
    print(f"Ambiguous matches: {len(ambiguous)}")
    if ambiguous:
        print("Sample ambiguous (idx, ingredient, candidate_fdcs):")
        for a in ambiguous[:10]:
            print(a)
    print(f"Not found after exact attempts: {len(not_found)} (sample up to 10):")
    for nf in not_found[:10]:
        print(nf)

    # Save backup and fixed file
    backup = ING_PATH.with_suffix(".backup.csv")
    fixed_path = ING_PATH.with_name(ING_PATH.stem + ".fixed" + ING_PATH.suffix)
    ing.to_csv(backup, index=False)
    ing.to_csv(fixed_path, index=False)
    print(f"Saved backup to: {backup}")
    print(f"Saved fixed file to: {fixed_path}")
    print("Done — inspect ambiguous / not-found cases and then, if OK, replace the original file with the fixed file.")

if __name__ == "__main__":
    main()
