#!/usr/bin/env python3
"""
Compute per-recipe nutrition using USDA Foundation / FNDDS CSVs.

Outputs:
 - data/ingredient_to_usda.csv   (ingredient_norm -> fdc_id mapping + score)
 - data/recipe_nutrition.csv     (one row per recipe with nutrient totals)

Notes / assumptions:
 - If ingredient quantities are not parseable, the script assumes 100 g per ingredient (you can change default).
 - Fuzzy matches with score >= FUZZY_THRESHOLD are auto-assigned; lower-score matches are left unmapped for manual review.
"""

import os
import json
import math
import csv
from collections import defaultdict
import pandas as pd
from unidecode import unidecode
from rapidfuzz import process, fuzz
import re

# ----- CONFIG -----
DATASETS_DIR = "datasets"
NUTR_DIR = os.path.join(DATASETS_DIR, "nutrition")
RECIPES_JSON = os.path.join(DATASETS_DIR, "recipes", "sample_recipes.json")
FOUNDATION_FOOD_CSV = os.path.join(NUTR_DIR, "foundation_food.csv")       # adjust filename if needed
FOOD_NUTRIENT_CSV = os.path.join(NUTR_DIR, "food_nutrient.csv")          # adjust filename if needed
NUTRIENT_DEF_CSV = os.path.join(NUTR_DIR, "nutrient.csv")                # nutrient definitions
FOOD_PORTION_CSV = os.path.join(NUTR_DIR, "food_portion.csv")            # optional for portion grams

OUTPUT_DIR = "data"
ING_MAP_OUT = os.path.join(OUTPUT_DIR, "ingredient_to_usda.csv")
RECIPE_NUT_OUT = os.path.join(OUTPUT_DIR, "recipe_nutrition.csv")

# If fuzzy match score >= threshold, auto-accept mapping
FUZZY_THRESHOLD = 85

# Fallback default grams per ingredient when quantity not available
DEFAULT_GRAMS_PER_ING = 100.0

# Nutrients we care about (these are common; we'll map by nutrient name)
TARGET_NUTRIENTS = {
    # nutrient name substrings -> canonical column name (units will vary)
    "energy": "calories_kcal",
    "protein": "protein_g",
    "carbohydrate": "carbs_g",
    "total lipid (fat)": "fat_g",
    "sugars": "sugar_g",
    "fiber": "fiber_g",
    "sodium": "sodium_mg",
    "saturated": "sat_fat_g",
}

# --------------------

os.makedirs(OUTPUT_DIR, exist_ok=True)

def normalize_text(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = unidecode(s).lower()
    # remove common noise words, sizes, punctuation and numbers
    s = re.sub(r'\b(chopped|diced|sliced|fresh|large|small|medium|cup[s]?|tbsp|tsp|tablespoon[s]?|teaspoon[s]?|grams?|g|kg|ml|ounce[s]?|oz)\b', ' ', s)
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# ----- Step 1: load USDA tables -----
print("Loading USDA Foundation / nutrient tables (this may take a moment)...")
# NOTE: adjust usecols if your CSVs have different column names
foundation_df = pd.read_csv(FOUNDATION_FOOD_CSV, low_memory=False)
food_nutrient_df = pd.read_csv(FOOD_NUTRIENT_CSV, low_memory=False)
nutrient_def_df = pd.read_csv(NUTRIENT_DEF_CSV, low_memory=False)

print("Foundation rows:", len(foundation_df))
print("Food_nutrient rows:", len(food_nutrient_df))
print("Nutrient defs rows:", len(nutrient_def_df))

# find the key fields: try common column names
# foundation: attempt to detect id and description column names
found_id_col = None
found_desc_col = None
for c in foundation_df.columns:
    if c.lower() in ("fdc_id","food_id","id"):
        found_id_col = c
    if c.lower() in ("description","food_description","description_long"):
        found_desc_col = c
# fallback guesses
if not found_id_col:
    possible = [c for c in foundation_df.columns if "id" in c.lower()]
    found_id_col = possible[0] if possible else foundation_df.columns[0]
if not found_desc_col:
    possible = [c for c in foundation_df.columns if "desc" in c.lower()]
    found_desc_col = possible[0] if possible else foundation_df.columns[1]

print("Using foundation id col:", found_id_col, "desc col:", found_desc_col)

# build list of food descriptions for fuzzy matching
foundation_df['desc_norm'] = foundation_df[found_desc_col].fillna("").astype(str).map(normalize_text)
food_names = foundation_df['desc_norm'].tolist()
fdc_ids = foundation_df[found_id_col].tolist()

# ----- Step 2: build nutrient lookup per fdc_id (values per 100g) -----
# food_nutrient_df usually has columns: fdc_id, nutrient_id, amount
# nutrient_def_df usually maps nutrient_id -> nutrient_name, unit_name
nid_col = None
fdc_col = None
amount_col = None
for c in food_nutrient_df.columns:
    lc = c.lower()
    if lc in ("fdc_id","food_id","id"):
        fdc_col = c
    if "nutrient" in lc and ("id" in lc or "num" in lc):
        nid_col = c
    if lc in ("amount","value"):
        amount_col = c
# fallbacks:
if not fdc_col: fdc_col = food_nutrient_df.columns[0]
if not nid_col: nid_col = food_nutrient_df.columns[1]
if not amount_col: amount_col = food_nutrient_df.columns[2]

print("food_nutrient columns used:", fdc_col, nid_col, amount_col)

# build nutrient_id -> name mapping
nutrient_def_map = {}
for _, r in nutrient_def_df.iterrows():
    # try to find id and name columns
    # different audit formats: 'nutrient_id' and 'name' or 'id' and 'nutrient_name'
    possible_id = None
    possible_name = None
    for c in nutrient_def_df.columns:
        if "id" in c.lower() and "nutrient" in c.lower():
            possible_id = c
        if c.lower() == "id":
            possible_id = possible_id or c
        if "name" in c.lower():
            possible_name = c
    # pick
    if possible_id and possible_name:
        nutrient_def_map[r[possible_id]] = r[possible_name]
# fallback: try common names
if not nutrient_def_map:
    if 'nutrient_id' in nutrient_def_df.columns and 'name' in nutrient_def_df.columns:
        nutrient_def_map = dict(zip(nutrient_def_df['nutrient_id'], nutrient_def_df['name']))

# Build nutrient lookup per fdc_id
print("Building nutrient lookup (fdc_id -> {nutrient_name:amount}) ...")
food_nutr_lookup = {}
for fdc_id, grp in food_nutrient_df.groupby(fdc_col):
    inner = {}
    for _, row in grp.iterrows():
        nid = row[nid_col]
        amt = row[amount_col]
        nname = nutrient_def_map.get(nid, str(nid))
        inner[nname.lower()] = float(amt) if not pd.isna(amt) else 0.0
    food_nutr_lookup[fdc_id] = inner

print("Nutrient lookup build complete. Example keys:", list(next(iter(food_nutr_lookup.values())).keys())[:8])

# ----- Step 3: load recipes -----
print("Loading recipes:", RECIPES_JSON)
with open(RECIPES_JSON, "r", encoding="utf-8") as f:
    recipes = json.load(f)

# recipes expected to be list of objects with 'id' and 'ingredients' (list of strings)
# if your recipes have different structure, adapt accordingly

# ---- Step 4: map ingredients to USDA (fuzzy) -----
ing_map = []   # rows to write out
ingredient_to_fdc = {}  # normalized ingredient -> (fdc_id, desc, score, method)

# collect a list of distinct ingredient raw strings from recipes
distinct_raw_ings = set()
for r in recipes:
    ings = r.get("ingredients", []) or []
    for ing in ings:
        distinct_raw_ings.add(ing)

distinct_raw_ings = sorted(distinct_raw_ings)
print("Found", len(distinct_raw_ings), "distinct ingredient strings in recipes (sample):", distinct_raw_ings[:10])

# run fuzzy match for each normalized ingredient
for raw in distinct_raw_ings:
    norm = normalize_text(raw)
    # exact match search on foundation desc_norm
    matches = []
    if norm in foundation_df['desc_norm'].values:
        idx = foundation_df[foundation_df['desc_norm']==norm].index[0]
        fdc = foundation_df.at[idx, found_id_col]
        desc = foundation_df.at[idx, found_desc_col]
        ingredient_to_fdc[norm] = (fdc, desc, 100, "exact")
    else:
        # fuzzy
        # process.extract returns list of tuples (match, score, index)
        candidates = process.extract(norm, food_names, scorer=fuzz.token_sort_ratio, limit=5)
        # pick best candidate
        if candidates:
            best_match, score, best_idx = candidates[0]
            best_fdc = foundation_df.at[best_idx, found_id_col]
            best_desc = foundation_df.at[best_idx, found_desc_col]
            if score >= FUZZY_THRESHOLD:
                ingredient_to_fdc[norm] = (best_fdc, best_desc, score, "fuzzy_auto")
            else:
                # mark as unmapped for manual review but still record top candidate
                ingredient_to_fdc[norm] = (best_fdc, best_desc, score, "fuzzy_manual_review")
        else:
            ingredient_to_fdc[norm] = (None, None, 0, "no_match")

# write ingredient_to_usda.csv
with open(ING_MAP_OUT, "w", newline="", encoding="utf-8") as csvf:
    w = csv.writer(csvf)
    w.writerow(["ingredient_raw", "ingredient_norm", "fdc_id", "fdc_description", "match_score", "mapped_by"])
    for raw in distinct_raw_ings:
        norm = normalize_text(raw)
        fdc_id, desc, score, method = ingredient_to_fdc.get(norm, (None, None, 0, "no_match"))
        w.writerow([raw, norm, fdc_id, desc, score, method])
print("Wrote ingredient mapping to:", ING_MAP_OUT)

# ----- Step 5: compute per-recipe nutrition -----
# helper to get nutrient amount per 100g for a given fdc_id
def get_nutrition_for_fdc(fdc_id):
    return food_nutr_lookup.get(fdc_id, {})

# choose nutrient name keys from our TARGET_NUTRIENTS mapping by substring matching
def find_nutrient_key(nutr_map, substring_list):
    # return the first key in nutr_map that contains any substring
    for k in nutr_map.keys():
        lk = k.lower()
        for sub in substring_list:
            if sub in lk:
                return k
    return None

# Build a small list of nutrient keys in a canonical form for the first available food
sample_fdcs = list(food_nutr_lookup.keys())[:10]
available_nutrient_keys = set()
for f in sample_fdcs:
    available_nutrient_keys.update(food_nutr_lookup.get(f, {}).keys())

print("Sample available nutrient keys (examples):", list(available_nutrient_keys)[:20])

# For mapping we will search for substrings specified in TARGET_NUTRIENTS
# e.g., 'energy' -> energy key, 'protein' -> protein key, etc.

# For each recipe compute totals
rows = []
for r in recipes:
    rid = r.get("id", r.get("title", ""))  # fallback
    title = r.get("title", "")
    ingredients = r.get("ingredients", []) or []
    totals = defaultdict(float)
    total_weight = 0.0

    for ing_raw in ingredients:
        norm = normalize_text(ing_raw)
        mapping = ingredient_to_fdc.get(norm, (None, None, 0, "no_match"))
        fdc_id = mapping[0]
        if fdc_id is None:
            # unknown mapping -> assume default grams
            grams = DEFAULT_GRAMS_PER_ING
            # can't compute nutrients accurately; skip or assign zeros
            total_weight += grams
            continue
        grams = DEFAULT_GRAMS_PER_ING  # simple default; you can parse unit/quantity later
        total_weight += grams
        nutr_for_food = get_nutrition_for_fdc(fdc_id)
        # add nutrients by searching for keys
        for substr, out_col in TARGET_NUTRIENTS.items():
            # find a matching nutrient key in nutr_for_food
            matching_key = None
            for k in nutr_for_food.keys():
                if substr in k.lower():
                    matching_key = k
                    break
            if matching_key:
                amt_per_100g = nutr_for_food.get(matching_key, 0.0)
                # units: energy often in kcal; others typically in g or mg depending on nutrient
                # assume values are per 100g in the table
                value = (amt_per_100g * grams) / 100.0
                totals[out_col] += value
            else:
                # if no matching key, skip (value remains)
                pass

    # post-process sodium unit: many databases store sodium in mg already; ensure column name matches expected
    row = {
        "recipe_id": rid,
        "title": title,
        "total_weight_g": total_weight,
    }
    # fill target columns
    for col in TARGET_NUTRIENTS.values():
        row[col] = round(totals.get(col, 0.0), 3)

    rows.append(row)

# write recipe_nutrition.csv
df_out = pd.DataFrame(rows)
df_out.to_csv(RECIPE_NUT_OUT, index=False)
print("Wrote recipe nutrition to:", RECIPE_NUT_OUT)
print("Sample output rows:")
print(df_out.head())

print("Done. Inspect", ING_MAP_OUT, "and", RECIPE_NUT_OUT, "for manual fixes and sanity checks.")
