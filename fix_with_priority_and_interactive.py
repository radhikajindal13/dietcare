#!/usr/bin/env python3
"""
fix_replace_ids.py

- Reads:
    data/ingredient_to_usda.csv
    dataset/nutrition/food.csv

- For rows where mapped_by is 'fuzzy_manual_review' or 'no_match':
    * Normalize ingredient text (ingredient_norm or ingredient_raw fallback)
    * Normalize food descriptions from food.csv
    * If normalized ingredient == normalized description:
        - If food.csv has exactly one fdc_id for that description -> replace fdc_id in ingredient file
        - If multiple fdc_ids exist for that description -> do NOT auto-replace; log as ambiguous
    * Leave other rows unchanged.

- Outputs:
    data/ingredient_to_usda.backup.csv  (original saved)
    data/ingredient_to_usda.fixed.csv   (updated)
    data/ingredient_ambiguous.csv       (rows not auto-fixed due to multiple matches)
"""
from pathlib import Path
import pandas as pd
import re
import sys

# Paths (adjust only if your files are elsewhere)
ING_PATH = Path("data/ingredient_to_usda.csv")
FOOD_PATH = Path("datasets/nutrition/food.csv")

# Columns (expected)
ING_FDC_COL = "fdc_id"
ING_MAPPED_BY = "mapped_by"
# prefer ingredient_norm, else ingredient_raw, else first candidate
ING_TEXT_CANDIDATES = ["ingredient_norm", "ingredient_raw", "ingredient", "fdc_description", "name"]

FOOD_FDC_COL = "fdc_id"
# food.csv description column names to try
FOOD_DESC_CANDIDATES = ["description", "fdc_description", "food_description", "food_name", "name"]

# normalize function
def norm_text(s):
    if pd.isna(s):
        return ""
    s = str(s).strip().lower()
    # remove punctuation commonly different between sources
    s = re.sub(r"[“”\"'•·,\/\\\(\)\[\]\{\}\.:;?!@#\$%^&\*\+=<>`~]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s

def find_column(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    # fallback heuristics:
    for c in df.columns:
        lc = c.lower()
        if any(k in lc for k in ("desc", "name", "ingredient")):
            return c
    return None

def main():
    if not ING_PATH.exists():
        print(f"Ingredient file not found at: {ING_PATH}", file=sys.stderr); sys.exit(1)
    if not FOOD_PATH.exists():
        print(f"Food file not found at: {FOOD_PATH}", file=sys.stderr); sys.exit(1)

    ing = pd.read_csv(ING_PATH, dtype=str, keep_default_na=False)
    food = pd.read_csv(FOOD_PATH, dtype=str, keep_default_na=False)

    print(f"Loaded ingredient file: {len(ing)} rows")
    print(f"Loaded food file: {len(food)} rows")

    # detect ingredient text column
    ing_text_col = find_column(ing, ING_TEXT_CANDIDATES)
    if ing_text_col is None:
        print("ERROR: couldn't find an ingredient text column in ingredient file.", file=sys.stderr); sys.exit(1)
    print(f"Using ingredient text column: '{ing_text_col}'")

    # detect food description column
    food_desc_col = find_column(food, FOOD_DESC_CANDIDATES)
    if food_desc_col is None:
        print("ERROR: couldn't find a description column in food.csv", file=sys.stderr); sys.exit(1)
    print(f"Using food description column: '{food_desc_col}'")

    # normalize columns
    ing["_norm_ing"] = ing[ing_text_col].apply(norm_text)
    food["_norm_desc"] = food[food_desc_col].apply(norm_text)

    # build mapping norm_desc -> list of fdc_ids
    desc_to_fdcs = {}
    for _, r in food.iterrows():
        nd = r["_norm_desc"]
        fid = r.get(FOOD_FDC_COL)
        if not nd or not fid:
            continue
        desc_to_fdcs.setdefault(nd, set()).add(fid)

    # select rows to process
    flagged_mask = ing[ING_MAPPED_BY].isin(["fuzzy_manual_review", "no_match"])
    flagged_indices = ing[flagged_mask].index.tolist()
    print(f"Rows to check (mapped_by fuzzy_manual_review or no_match): {len(flagged_indices)}")

    fixed_count = 0
    ambiguous_rows = []

    for idx in flagged_indices:
        norm_ing = ing.at[idx, "_norm_ing"]
        if not norm_ing:
            # nothing to match
            continue
        cands = desc_to_fdcs.get(norm_ing)
        if not cands:
            # no exact match in food descriptions
            continue
        # if exactly one fdc_id for this normalized description -> apply it
        if len(cands) == 1:
            chosen_fdc = next(iter(cands))
            prev = ing.at[idx, ING_FDC_COL]
            if prev != chosen_fdc:
                ing.at[idx, ING_FDC_COL] = chosen_fdc
                ing.at[idx, ING_MAPPED_BY] = "exact_match_fix"
                fixed_count += 1
        else:
            # multiple fdc_ids for same normalized description -> record ambiguous and skip auto-change
            ambiguous_rows.append({
                "index": idx,
                ing_text_col: ing.at[idx, ing_text_col],
                "norm_ingredient": norm_ing,
                "candidate_fdcs": ";".join(sorted(cands))
            })

    # save backup and fixed file
    backup_path = ING_PATH.with_suffix(".backup.csv")
    fixed_path = ING_PATH.with_name(ING_PATH.stem + ".fixed" + ING_PATH.suffix)
    ambiguous_path = Path("data/ingredient_to_usda.ambiguous.csv")

    ing.to_csv(backup_path, index=False)
    ing.to_csv(fixed_path, index=False)

    if ambiguous_rows:
        pd.DataFrame(ambiguous_rows).to_csv(ambiguous_path, index=False)
        print(f"Ambiguous rows written to: {ambiguous_path} (inspect these manually)")
    else:
        print("No ambiguous multiple-fdc situations encountered.")

    print(f"Total exact-match replacements applied: {fixed_count}")
    print(f"Backup saved to: {backup_path}")
    print(f"Fixed file saved to: {fixed_path}")
    print("Done. Review fixed file and ambiguous CSV (if present) before replacing original.")

if __name__ == "__main__":
    main()
