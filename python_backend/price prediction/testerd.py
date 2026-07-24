"""
Crop Recommendation Engine
--------------------------
Integrates:
  - A crop recommendation model (pickle) → top-N crops with confidence scores
  - Per-crop price prediction models (pickle, one per crop) → price at harvest

Output includes allCandidates (all 15 crops scored) plus three highlighted picks:
  safest   → highest suitability (best model fit)
  cheapest → lowest cost per acre
  profitable → highest absolute profit
"""

import os
import pickle
import numpy as np
from typing import Any
import pandas as pd
from datetime import datetime, timedelta

# ---------------------------------------------------------------------------
# 1.  PATHS  —  adjust to your project layout
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CROP_MODEL_PATH = os.path.join(BASE_DIR, "..", "CRver2_RandomForest.pkl")
PRICE_MODELS_DIR = BASE_DIR

# ---------------------------------------------------------------------------
# 2.  STATIC AGRICULTURAL DATA  (Indian averages, per-acre basis)
#     Sources: ICAR, Agmarknet, various state agri dept publications
# ---------------------------------------------------------------------------

CROP_DATA: dict[str, dict] = {
    # ── RICE ──────────────────────────────────────────────────────────────────
    "rice_basmati": {
        "cost": 35000,        # ₹/acre — higher due to specific water & care needs
        "yield_qtl": 18,      # quintals/acre — lower yield but premium price
        "grow_days": 150,     # long duration variety
        "season": ["Kharif"]
    },
    "rice_non_basmati": {
        "cost": 24000,
        "yield_qtl": 25,      # higher yield, standard variety
        "grow_days": 120,
        "season": ["Kharif"]
    },
    "rice_sona_masuri": {
        "cost": 27000,        # medium-fine variety, AP/Telangana staple
        "yield_qtl": 22,
        "grow_days": 135,
        "season": ["Kharif"]
    },

    # ── WHEAT ─────────────────────────────────────────────────────────────────
    "wheat_durum": {
        "cost": 26000,        # hard wheat, used for semolina/pasta
        "yield_qtl": 16,      # slightly lower yield than common
        "grow_days": 150,
        "season": ["Rabi"]
    },
    "wheat_common": {
        "cost": 21000,        # most widely grown, lowest input cost
        "yield_qtl": 22,
        "grow_days": 145,
        "season": ["Rabi"]
    },
    "wheat_sharbati": {
        "cost": 28000,        # premium MP variety, soft & sweet
        "yield_qtl": 18,
        "grow_days": 155,
        "season": ["Rabi"]
    },

    # ── MAIZE ─────────────────────────────────────────────────────────────────
    "maize_sweet_corn": {
        "cost": 22000,        # higher seed cost, shorter shelf life
        "yield_qtl": 12,      # sold fresh, lower qtl but higher ₹/qtl
        "grow_days": 75,
        "season": ["Kharif", "Zaid"]
    },
    "maize_feed_corn": {
        "cost": 16000,        # bulk commodity, lowest cost maize
        "yield_qtl": 28,      # highest yield among maize varieties
        "grow_days": 90,
        "season": ["Kharif", "Zaid"]
    },
    "maize_popcorn": {
        "cost": 20000,        # specialty seed, moderate input
        "yield_qtl": 14,
        "grow_days": 85,
        "season": ["Kharif", "Zaid"]
    },

    # ── MILLET ────────────────────────────────────────────────────────────────
    "millet_pearl": {          # Bajra — most common, drought tolerant
        "cost": 10000,
        "yield_qtl": 8,
        "grow_days": 75,
        "season": ["Kharif"]
    },
    "millet_finger": {         # Ragi — Karnataka/AP staple
        "cost": 11000,
        "yield_qtl": 7,
        "grow_days": 120,
        "season": ["Kharif"]
    },
    "millet_foxtail": {        # Kangni — short duration, nutritious
        "cost": 9000,
        "yield_qtl": 6,
        "grow_days": 75,
        "season": ["Kharif"]
    },
    "millet_sorghum": {        # Jowar — dual purpose grain + fodder
        "cost": 10500,
        "yield_qtl": 9,
        "grow_days": 110,
        "season": ["Kharif", "Rabi"]
    },

    # ── SOYBEAN ───────────────────────────────────────────────────────────────
    "soybean_food_grade": {    # edamame / tofu grade, premium market
        "cost": 22000,
        "yield_qtl": 10,
        "grow_days": 100,
        "season": ["Kharif"]
    },
    "soybean_oil_grade": {     # bulk crushing/oil extraction grade
        "cost": 18000,
        "yield_qtl": 13,       # higher yield, lower price per qtl
        "grow_days": 95,
        "season": ["Kharif"]
    },
}

ALL_CROPS: list[str] = list(CROP_DATA.keys())  # 15 crops

ALL_CROPS: list[str] = list(CROP_DATA.keys())  # 15 crops

SEASON_MAP = {
    "Kharif":  "Kharif (Monsoon)",
    "Rabi":    "Rabi (Winter)",
    "Zaid":    "Zaid (Summer)",
    "Annual":  "Annual",
}

# ---------------------------------------------------------------------------
# 3.  MODEL LOADING
# ---------------------------------------------------------------------------

def load_pickle(path: str) -> Any:
    with open(path, "rb") as f:
        return pickle.load(f)


def load_crop_recommendation_model() -> Any:
    return load_pickle(CROP_MODEL_PATH)


def load_price_models() -> dict[str, Any]:
    """Load one price model per crop. Missing models are skipped with a warning."""
    models = {}
    for crop in ALL_CROPS:
        path = os.path.join(PRICE_MODELS_DIR, f"{crop}.pkl")
        if os.path.exists(path):
            models[crop] = load_pickle(path)
        else:
            print(f"[WARN] Price model not found for '{crop}': {path}")
    return models


# ---------------------------------------------------------------------------
# 4.  RECOMMENDATION MODEL  —  get confidence scores for all crops
# ---------------------------------------------------------------------------

def get_suitability_scores(
    rec_model: Any,
    soil: dict,
    weather: dict,
) -> dict[str, float]:
    """
    Returns a suitability score (0–100) for every crop.

    Assumes the recommendation model exposes predict_proba() and was trained
    with classes_ attribute (standard sklearn interface).  If your model uses
    a different interface, adjust this function.

    The top-3 crops receive their raw confidence × 100 as suitability.
    Remaining crops are scaled proportionally from the probability vector so
    the scores remain comparable but are naturally lower.
    """
    features = np.array([[
        soil["n"], soil["p"], soil["k"], soil["ph"],
        weather["temperature"], weather["humidity"], weather["rainfall"],
    ]])

    # Probability for every class the model knows about
    proba = rec_model.predict_proba(features)[0]          # shape: (n_classes,)
    class_labels = [str(c).lower() for c in rec_model.classes_]

    # Map model classes → probabilities
    prob_map: dict[str, float] = dict(zip(class_labels, proba))

    scores: dict[str, float] = {}
    for crop in ALL_CROPS:
        raw = prob_map.get(crop, 0.0)          # 0 if model doesn't know the crop
        scores[crop] = round(raw * 100, 2)     # convert to 0–100 scale

    return scores


# ---------------------------------------------------------------------------
# 5.  PRICE PREDICTION  —  run each crop's model at mid-season & harvest
# ---------------------------------------------------------------------------

def predict_price(model: Any, n_days: int) -> float:
    future_date = datetime.today() + timedelta(days=n_days)
    future_df = pd.DataFrame({"ds": [future_date]})
    forecast = model.predict(future_df)
    return float(forecast["yhat"].iloc[0])


def get_price_and_reliability(
    price_models: dict[str, Any],
    crop: str,
) -> tuple[float, float]:
    grow_days = CROP_DATA[crop]["grow_days"]
    model = price_models.get(crop)

    if model is None:
        return 0.0, 50.0

    mid_price     = predict_price(model, grow_days // 2)
    harvest_price = predict_price(model, grow_days)

    if mid_price > 0:
        pct_change = abs((harvest_price - mid_price) / mid_price) * 100
    else:
        pct_change = 0.0

    if pct_change < 5:
        reliability = 80 + (5 - pct_change) * 4
    elif pct_change < 20:
        reliability = 40 + (20 - pct_change) * (40 / 15)
    else:
        reliability = max(0.0, 40 - (pct_change - 20))

    return harvest_price, round(min(reliability, 100), 2)


# ---------------------------------------------------------------------------
# 6.  PROFIT & SAFETY CALCULATION
# ---------------------------------------------------------------------------

def compute_profit(crop: str, harvest_price_per_qtl: float) -> int:
    """profit = predicted_price × avg_yield_per_acre - cost_per_acre  (₹)"""
    data = CROP_DATA[crop]
    revenue = harvest_price_per_qtl * data["yield_qtl"]
    profit  = revenue - data["cost"]
    return int(round(profit))


def compute_safety(reliability: float, cost: int, profit: int) -> float:
    """
    Safety = weighted combo of:
      - Reliability   (60 %) — price predictability
      - ROI safety    (40 %) — higher ROI with lower cost is safer

    Normalised to 0–10 for readability.
    """
    roi = (profit / cost * 100) if cost > 0 else 0

    # Normalise ROI: cap reference at 300 % → maps to score of 10
    roi_score = min(roi / 30, 10) if roi > 0 else 0

    reliability_score = reliability / 10          # 0–100 → 0–10

    safety = 0.6 * reliability_score + 0.4 * roi_score
    return round(safety, 1)


# ---------------------------------------------------------------------------
# 7.  SEASON DETECTION
# ---------------------------------------------------------------------------

def detect_season(temperature: float, rainfall: float) -> str:
    """Simple heuristic season detection from weather inputs."""
    if rainfall > 5:
        return "Kharif"
    elif temperature < 20:
        return "Rabi"
    else:
        return "Zaid"


# ---------------------------------------------------------------------------
# 8.  MAIN RECOMMENDATION FUNCTION
# ---------------------------------------------------------------------------

def recommend_crops(
    soil: dict,
    weather: dict,
) -> dict:
    """
    Parameters
    ----------
    soil    : {"n": int, "p": int, "k": int, "ph": float}
    weather : {"temperature": float, "humidity": float, "rainfall": float}

    Returns
    -------
    Full recommendation dict matching the specified output schema.
    """

    # -- Load models --
    rec_model    = load_crop_recommendation_model()
    price_models = load_price_models()

    # -- Suitability scores from recommendation model --
    suitability_scores = get_suitability_scores(rec_model, soil, weather)

    # -- Season --
    season_key  = detect_season(weather["temperature"], weather["rainfall"])
    season_label = SEASON_MAP[season_key]

    # -- Build candidate list for all 15 crops --
    candidates = []

    for crop in ALL_CROPS:
        data        = CROP_DATA[crop]
        cost        = data["cost"]
        suitability = suitability_scores.get(crop, 0.0)

        harvest_price, reliability = get_price_and_reliability(price_models, crop)
        profit  = compute_profit(crop, harvest_price)
        safety  = compute_safety(reliability, cost, profit)

        candidates.append({
            "crop":        crop,
            "cost":        cost,
            "profit":      profit,
            "suitability": suitability,
            "reliability": reliability,
            "safety":      safety,
        })

    # -- Three highlighted picks --
    # -- Three highlighted picks --

    SUITABILITY_THRESHOLD = 10.0  # only crops with suitability >= this are considered

    eligible = [c for c in candidates if c["suitability"] >= SUITABILITY_THRESHOLD]

# Fall back to all candidates if nothing passes the threshold
    if not eligible:
        eligible = candidates
        print("[WARN] No crops met the suitability threshold. Falling back to all candidates.")

    safest     = max(eligible, key=lambda c: c["suitability"])
    cheapest   = min(eligible, key=lambda c: c["cost"])
    profitable = max(eligible, key=lambda c: c["profit"])

    def slim(c: dict) -> dict:
        """Strip reliability from highlighted picks (matches schema)."""
        return {
            "crop":        c["crop"],
            "cost":        c["cost"],
            "profit":      c["profit"],
            "safety":      c["safety"],
            "suitability": c["suitability"],
        }

    return {
        "recommendations": {
            "allCandidates": candidates,
            "safest":        slim(safest),
            "cheapest":      slim(cheapest),
            "profitable":    slim(profitable),
            "season":        season_label,
        },
        "weatherUsed": {
            "temperature": weather["temperature"],
            "humidity":    weather["humidity"],
            "rainfall":    weather["rainfall"],
        },
        "soilUsed": {
            "n":  soil["n"],
            "p":  soil["p"],
            "k":  soil["k"],
            "ph": soil["ph"],
        },
    }


# ---------------------------------------------------------------------------
# 9.  EXAMPLE USAGE
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json

    soil_input = {
        "n":  90,
        "p":  42,
        "k":  43,
        "ph": 6.5,
    }

    weather_input = {
        "temperature": 34.0,
        "humidity":    40.0,
        "rainfall":    0.6,
    }

    result = recommend_crops(soil=soil_input, weather=weather_input)
    print(json.dumps(result, indent=4))