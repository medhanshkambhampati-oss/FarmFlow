from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import joblib
import pickle
import numpy as np
import pandas as pd
import traceback
from typing import Any
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# 1.  PATHS  —  Portable workspace paths
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CROP_MODEL_PATH = os.path.join(BASE_DIR, "CRver2_RandomForest.pkl")
PRICE_MODELS_DIR = os.path.join(BASE_DIR, "price prediction")
YIELD_MODEL_PATH    = os.path.join(BASE_DIR, "crop_yield_model.pkl")
YIELD_ENCODERS_PATH = os.path.join(BASE_DIR, "yield_label_encoders.pkl")
YIELD_FEATURES_PATH = os.path.join(BASE_DIR, "yield_feature_cols.pkl")
NPK_MODEL_PATH    = os.path.join(BASE_DIR, "npk_model.pkl")
NPK_SCALER_PATH   = os.path.join(BASE_DIR, "npk_scaler.pkl")
NPK_FEATURES_PATH = os.path.join(BASE_DIR, "npk_features.pkl")

# ---------------------------------------------------------------------------
# 2.  STATIC AGRICULTURAL DATA  (Indian averages, per-acre basis)
# ---------------------------------------------------------------------------

CROP_DATA: dict[str, dict] = {
    # ── RICE ──────────────────────────────────────────────────────────────────
    "rice_basmati": {
        "cost": 35000,
        "yield_qtl": 18,
        "grow_days": 150,
        "season": ["Kharif"]
    },
    "rice_non_basmati": {
        "cost": 24000,
        "yield_qtl": 25,
        "grow_days": 120,
        "season": ["Kharif"]
    },
    "rice_sona_masuri": {
        "cost": 27000,
        "yield_qtl": 22,
        "grow_days": 135,
        "season": ["Kharif"]
    },

    # ── WHEAT ─────────────────────────────────────────────────────────────────
    "wheat_durum": {
        "cost": 26000,
        "yield_qtl": 16,
        "grow_days": 150,
        "season": ["Rabi"]
    },
    "wheat_common": {
        "cost": 21000,
        "yield_qtl": 22,
        "grow_days": 145,
        "season": ["Rabi"]
    },
    "wheat_sharbati": {
        "cost": 28000,
        "yield_qtl": 18,
        "grow_days": 155,
        "season": ["Rabi"]
    },

    # ── MAIZE ─────────────────────────────────────────────────────────────────
    "maize_sweet_corn": {
        "cost": 22000,
        "yield_qtl": 12,
        "grow_days": 75,
        "season": ["Kharif", "Zaid"]
    },
    "maize_feed_corn": {
        "cost": 16000,
        "yield_qtl": 28,
        "grow_days": 90,
        "season": ["Kharif", "Zaid"]
    },
    "maize_popcorn": {
        "cost": 20000,
        "yield_qtl": 14,
        "grow_days": 85,
        "season": ["Kharif", "Zaid"]
    },

    # ── MILLET ────────────────────────────────────────────────────────────────
    "millet_pearl": {
        "cost": 10000,
        "yield_qtl": 8,
        "grow_days": 75,
        "season": ["Kharif"]
    },
    "millet_finger": {
        "cost": 11000,
        "yield_qtl": 7,
        "grow_days": 120,
        "season": ["Kharif"]
    },
    "millet_foxtail": {
        "cost": 9000,
        "yield_qtl": 6,
        "grow_days": 75,
        "season": ["Kharif"]
    },
    "millet_sorghum": {
        "cost": 10500,
        "yield_qtl": 9,
        "grow_days": 110,
        "season": ["Kharif", "Rabi"]
    },

    # ── SOYBEAN ───────────────────────────────────────────────────────────────
    "soybean_food_grade": {
        "cost": 22000,
        "yield_qtl": 10,
        "grow_days": 100,
        "season": ["Kharif"]
    },
    "soybean_oil_grade": {
        "cost": 18000,
        "yield_qtl": 13,
        "grow_days": 95,
        "season": ["Kharif"]
    },
}

ALL_CROPS: list[str] = list(CROP_DATA.keys())

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
    # Use joblib for better compatibility with scikit-learn 1.6+
    return joblib.load(path)


def load_crop_recommendation_model() -> Any:
    return load_pickle(CROP_MODEL_PATH)


def load_price_models() -> dict[str, Any]:
    models = {}
    for crop in ALL_CROPS:
        path = os.path.join(PRICE_MODELS_DIR, f"{crop}.pkl")
        if os.path.exists(path):
            models[crop] = load_pickle(path)
    return models

# Pre-load models for speed
print("Loading models...")
rec_model = load_crop_recommendation_model()
price_models = load_price_models()

# Load yield prediction model
yield_model = None
yield_label_encoders = {}
yield_feature_cols = []
try:
    yield_model = joblib.load(YIELD_MODEL_PATH)
    with open(YIELD_ENCODERS_PATH, 'rb') as f:
        yield_label_encoders = pickle.load(f)
    with open(YIELD_FEATURES_PATH, 'rb') as f:
        yield_feature_cols = pickle.load(f)
    print("Yield model loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load yield model: {e}")

print("Models loaded successfully!")

# Load post-harvest NPK model
npk_model = None
npk_scaler = None
npk_features = []
try:
    with open(NPK_MODEL_PATH,    'rb') as f: npk_model    = pickle.load(f)
    with open(NPK_SCALER_PATH,   'rb') as f: npk_scaler   = pickle.load(f)
    with open(NPK_FEATURES_PATH, 'rb') as f: npk_features = pickle.load(f)
    print("Post-harvest NPK model loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load NPK model: {e}")

# ---------------------------------------------------------------------------
# 4.  RECOMMENDATION MODEL
# ---------------------------------------------------------------------------

def get_suitability_scores(
    rec_model: Any,
    soil: dict,
    weather: dict,
) -> dict[str, float]:
    features = np.array([[
        soil["n"], soil["p"], soil["k"],
        weather["temperature"], weather["humidity"],
        soil["ph"], weather["rainfall"],
    ]])

    proba = rec_model.predict_proba(features)[0]
    
    # NOTE: The model uses integer classes 0-14 matching the order of ALL_CROPS.
    # We map them directly to ensure correct suitability labeling.
    scores: dict[str, float] = {}
    for i, crop in enumerate(ALL_CROPS):
        scores[crop] = round(float(proba[i]) * 100, 2)

    return scores


# ---------------------------------------------------------------------------
# 5.  PRICE PREDICTION
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

    pct_change = abs((harvest_price - mid_price) / mid_price) * 100 if mid_price > 0 else 0.0

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
    data = CROP_DATA[crop]
    revenue = harvest_price_per_qtl * data["yield_qtl"]
    profit  = revenue - data["cost"]
    return int(round(profit))


def compute_safety(reliability: float, cost: int, profit: int) -> float:
    roi = (profit / cost * 100) if cost > 0 else 0
    roi_score = min(roi / 30, 10) if roi > 0 else 0
    reliability_score = reliability / 10
    safety = 0.6 * reliability_score + 0.4 * roi_score
    return round(safety, 1)


# ---------------------------------------------------------------------------
# 7.  SEASON DETECTION
# ---------------------------------------------------------------------------

def detect_season(temperature: float, rainfall: float) -> str:
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
    # Suitability scores
    suitability_scores = get_suitability_scores(rec_model, soil, weather)

    # Season
    season_key  = detect_season(weather["temperature"], weather["rainfall"])
    season_label = SEASON_MAP.get(season_key, season_key)

    # Build candidates
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

    # Threshold-based picks
    SUITABILITY_THRESHOLD = 10.0
    eligible = [c for c in candidates if c["suitability"] >= SUITABILITY_THRESHOLD]

    if not eligible:
        eligible = candidates

    safest     = max(eligible, key=lambda c: c["suitability"])
    cheapest   = min(eligible, key=lambda c: c["cost"])
    profitable = max(eligible, key=lambda c: c["profit"])

    def slim(c: dict) -> dict:
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
        "weatherUsed": weather,
        "soilUsed":    soil,
    }


# ---------------------------------------------------------------------------
# 9.  FLASK ROUTES
# ---------------------------------------------------------------------------

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "ML Server is running"}), 200

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        soil = {
            "n": float(data.get("N", 0) or 0),
            "p": float(data.get("P", 0) or 0),
            "k": float(data.get("K", 0) or 0),
            "ph": float(data.get("ph", 0) or 0),
        }
        weather = {
            "temperature": float(data.get("temperature", 25) or 25),
            "humidity": float(data.get("humidity", 50) or 50),
            "rainfall": float(data.get("rainfall", 100) or 100),
        }

        result = recommend_crops(soil, weather)
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/predict_post_harvest", methods=["POST"])
def predict_post_harvest():
    try:
        data = request.json
        crop_name = data.get("crop", "").lower()
        n = float(data.get("n", 0))
        p = float(data.get("p", 0))
        k = float(data.get("k", 0))

        # --- Try ML model first ---
        if npk_model is not None and npk_scaler is not None and npk_features:
            try:
                # Map crop name to Crop_Category and Crop_Variety
                # crop_name is like "rice_basmati", "maize_feed_corn", etc.
                crop_category_map = {
                    "rice": "Rice", "wheat": "Wheat", "maize": "Maize",
                    "millet": "Millet", "soybean": "Soybean"
                }
                crop_variety_map = {
                    "rice_basmati": "Rice (Basmati)",
                    "rice_non_basmati": "Rice (Non-Basmati)",
                    "rice_sona_masuri": "Rice (Sona Masuri)",
                    "wheat_durum": "Wheat (Durum)",
                    "wheat_common": "Wheat (Common)",
                    "wheat_sharbati": "Wheat (Sharbati)",
                    "maize_sweet_corn": "Maize (Sweet Corn)",
                    "maize_feed_corn": "Maize (Feed Corn)",
                    "maize_popcorn": "Maize (Popcorn)",
                    "millet_pearl": "Millet (Pearl/Bajra)",
                    "millet_finger": "Millet (Finger/Ragi)",
                    "millet_foxtail": "Millet (Foxtail)",
                    "millet_sorghum": "Millet (Sorghum/Jowar)",
                    "soybean_food_grade": "Soybean (Food Grade)",
                    "soybean_oil_grade": "Soybean (Oil Grade)",
                }

                # Determine category from crop name prefix
                cat_key = crop_name.split("_")[0] if "_" in crop_name else crop_name
                crop_category = crop_category_map.get(cat_key, "Rice")
                crop_variety  = crop_variety_map.get(crop_name, "Rice (Basmati)")

                # Build a row with typical/average values for non-NPK fields
                row = {
                    "Temperature_Avg_C":               27.0,
                    "Temperature_Min_C":               20.0,
                    "Temperature_Max_C":               34.0,
                    "Rainfall_mm":                     800.0,
                    "Humidity_Percent":                65.0,
                    "Sunshine_Hours":                  7.0,
                    "Growing_Season_Days":             120.0,
                    "Soil_pH":                         6.5,
                    "Nitrogen_kg_per_ha":              n,
                    "Phosphorus_kg_per_ha":            p,
                    "Potassium_kg_per_ha":             k,
                    "Organic_Matter_Percent":          3.0,
                    "Soil_Moisture_Percent":           60.0,
                    "Farm_Size_ha":                    1.0,
                    "Fertilizer_Nitrogen_kg_per_ha":   0.0,
                    "Fertilizer_Phosphorus_kg_per_ha": 0.0,
                    "Fertilizer_Potassium_kg_per_ha":  0.0,
                    "Pesticide_Usage":                 1.0,
                    "Yield_tons_per_ha":               3.0,
                    # Categorical dummies — all 0 by default
                    "Crop_Category_Millet":            1.0 if crop_category == "Millet"  else 0.0,
                    "Crop_Category_Rice":              1.0 if crop_category == "Rice"    else 0.0,
                    "Crop_Category_Soybean":           1.0 if crop_category == "Soybean" else 0.0,
                    "Crop_Category_Wheat":             1.0 if crop_category == "Wheat"   else 0.0,
                    "Crop_Variety_Maize (Popcorn)":       1.0 if crop_variety == "Maize (Popcorn)"       else 0.0,
                    "Crop_Variety_Maize (Sweet Corn)":    1.0 if crop_variety == "Maize (Sweet Corn)"    else 0.0,
                    "Crop_Variety_Millet (Finger/Ragi)": 1.0 if crop_variety == "Millet (Finger/Ragi)" else 0.0,
                    "Crop_Variety_Millet (Foxtail)":      1.0 if crop_variety == "Millet (Foxtail)"      else 0.0,
                    "Crop_Variety_Millet (Pearl/Bajra)": 1.0 if crop_variety == "Millet (Pearl/Bajra)" else 0.0,
                    "Crop_Variety_Millet (Sorghum/Jowar)": 1.0 if crop_variety == "Millet (Sorghum/Jowar)" else 0.0,
                    "Crop_Variety_Rice (Basmati)":        1.0 if crop_variety == "Rice (Basmati)"        else 0.0,
                    "Crop_Variety_Rice (Non-Basmati)":    1.0 if crop_variety == "Rice (Non-Basmati)"    else 0.0,
                    "Crop_Variety_Rice (Sona Masuri)":    1.0 if crop_variety == "Rice (Sona Masuri)"    else 0.0,
                    "Crop_Variety_Soybean (Food Grade)":  1.0 if crop_variety == "Soybean (Food Grade)"  else 0.0,
                    "Crop_Variety_Soybean (Oil Grade)":   1.0 if crop_variety == "Soybean (Oil Grade)"   else 0.0,
                    "Crop_Variety_Wheat (Common)":        1.0 if crop_variety == "Wheat (Common)"        else 0.0,
                    "Crop_Variety_Wheat (Durum)":         1.0 if crop_variety == "Wheat (Durum)"         else 0.0,
                    "Crop_Variety_Wheat (Sharbati)":      1.0 if crop_variety == "Wheat (Sharbati)"      else 0.0,
                    "Seed_Type_Hybrid":       0.0,
                    "Seed_Type_Traditional":  0.0,
                    "Soil_Type_Black":        0.0,
                    "Soil_Type_Clayey":       0.0,
                    "Soil_Type_Desert":       0.0,
                    "Soil_Type_Laterite":     0.0,
                    "Soil_Type_Loamy":        0.0,
                    "Soil_Type_Red":          0.0,
                    "Soil_Type_Sandy":        0.0,
                    "Irrigation_Type_Flood":      0.0,
                    "Irrigation_Type_Rainfed":    0.0,
                    "Irrigation_Type_Sprinkler":  0.0,
                    "Season_Rabi":   0.0,
                    "Season_Zaid":   0.0,
                    "Previous_Crop_Fallow":    0.0,
                    "Previous_Crop_Maize":     0.0,
                    "Previous_Crop_Millet":    0.0,
                    "Previous_Crop_Pulses":    0.0,
                    "Previous_Crop_Rice":      0.0,
                    "Previous_Crop_Soybean":   0.0,
                    "Previous_Crop_Sugarcane": 0.0,
                    "Previous_Crop_Wheat":     0.0,
                }

                # Build DataFrame aligned with training features
                X_row = pd.DataFrame([row])[npk_features]
                X_scaled = npk_scaler.transform(X_row)
                pred = npk_model.predict(X_scaled)[0]

                post_n = round(max(0.0, float(pred[0])), 2)
                post_p = round(max(0.0, float(pred[1])), 2)
                post_k = round(max(0.0, float(pred[2])), 2)

                return jsonify({
                    "crop": crop_name,
                    "nn": post_n,
                    "np": post_p,
                    "nk": post_k,
                    "method": "ml"
                })
            except Exception as ml_err:
                print(f"ML NPK prediction failed, falling back to rule-based: {ml_err}")

        # --- Fallback: rule-based consumption estimates ---
        cons = {'n': 40, 'p': 10, 'k': 30}
        if 'rice' in crop_name:   cons = {'n': 60, 'p': 15, 'k': 40}
        elif 'maize' in crop_name: cons = {'n': 80, 'p': 20, 'k': 50}
        elif 'wheat' in crop_name: cons = {'n': 50, 'p': 12, 'k': 35}
        elif 'millet' in crop_name: cons = {'n': 30, 'p': 8,  'k': 25}
        elif 'soybean' in crop_name: cons = {'n': 20, 'p': 15, 'k': 30}

        return jsonify({
            "crop": crop_name,
            "nn": max(0, round(n - cons["n"], 2)),
            "np": max(0, round(p - cons["p"], 2)),
            "nk": max(0, round(k - cons["k"], 2)),
            "method": "rule-based"
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/cost_analysis", methods=["POST"])
def cost_analysis():
    try:
        data = request.json
        size = float(data.get("size", 1))
        # Simple estimation: 20000 per acre
        return jsonify({
            "status": "success",
            "estimated_cost": 20000 * size,
            "message": "Cost analysis calculated successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict_yield", methods=["POST"])
def predict_yield():
    """Predict crop yield using XGBoost model.
    
    Expected input JSON:
    {
        crop_variety: str,        # e.g. "Rice (Basmati)"
        seed_type: str,           # "Hybrid", "Traditional", "HYV"
        irrigation_type: str,     # "Flood", "Rainfed", "Sprinkler", "Drip"
        fertilizer_n: float,      # kg/ha
        fertilizer_p: float,      # kg/ha
        fertilizer_k: float,      # kg/ha
        use_fertilizer: bool,     # if false, fertilizer=0
        temp_avg: float,          # avg temp over 6 months (C)
        temp_min: float,          # min temp (C)
        temp_max: float,          # max temp (C)
        rainfall_mm: float,       # total rainfall mm
        sunshine_hours: float,    # avg daily sunshine hours
        soil_n: float,            # soil nitrogen kg/ha
        soil_p: float,            # soil phosphorus kg/ha
        soil_k: float,            # soil potassium kg/ha
        soil_ph: float,           # soil pH
        soil_type: str,           # "Alluvial" etc — optional, defaults Alluvial
    }
    """
    if yield_model is None:
        return jsonify({"error": "Yield prediction model not loaded"}), 503

    try:
        data = request.json

        # ── Extract user inputs ──────────────────────────────────────────────
        crop_variety    = data.get("crop_variety", "Rice (Basmati)")
        seed_type       = data.get("seed_type", "Hybrid")
        irrigation_type = data.get("irrigation_type", "Flood")
        use_fertilizer  = bool(data.get("use_fertilizer", False))
        fert_n = float(data.get("fertilizer_n", 0)) if use_fertilizer else 0.0
        fert_p = float(data.get("fertilizer_p", 0)) if use_fertilizer else 0.0
        fert_k = float(data.get("fertilizer_k", 0)) if use_fertilizer else 0.0

        temp_avg       = float(data.get("temp_avg", 27))
        temp_min       = float(data.get("temp_min", 20))
        temp_max       = float(data.get("temp_max", 34))
        rainfall_mm    = float(data.get("rainfall_mm", 800))
        sunshine_hours = float(data.get("sunshine_hours", 7))
        soil_n         = float(data.get("soil_n", 50))
        soil_p         = float(data.get("soil_p", 25))
        soil_k         = float(data.get("soil_k", 30))
        soil_ph        = float(data.get("soil_ph", 6.5))
        soil_type      = data.get("soil_type", "Alluvial")
        humidity       = float(data.get("humidity", 65))

        # Derive crop category from variety
        variety_to_category = {
            "Rice (Basmati)": "Rice",
            "Rice (Non-Basmati)": "Rice",
            "Rice (Sona Masuri)": "Rice",
            "Wheat (Common)": "Wheat",
            "Wheat (Durum)": "Wheat",
            "Wheat (Sharbati)": "Wheat",
            "Maize (Sweet Corn)": "Maize",
            "Maize (Feed Corn)": "Maize",
            "Maize (Popcorn)": "Maize",
            "Millet (Pearl/Bajra)": "Millet",
            "Millet (Finger/Ragi)": "Millet",
            "Millet (Foxtail)": "Millet",
            "Millet (Sorghum/Jowar)": "Millet",
            "Soybean (Food Grade)": "Soybean",
            "Soybean (Oil Grade)": "Soybean",
        }
        crop_category = variety_to_category.get(crop_variety, "Rice")

        # Season derived from temp/rainfall (same logic as crop recommendation)
        if rainfall_mm > 400:
            season = "Kharif"
        elif temp_avg < 20:
            season = "Rabi"
        else:
            season = "Zaid"

        # Growing season days approximate from typical values
        grow_days_map = {
            "Rice": 135, "Wheat": 150, "Maize": 90,
            "Millet": 90, "Soybean": 100
        }
        growing_days = grow_days_map.get(crop_category, 120)

        # ── Encode categorical values ────────────────────────────────────────
        def safe_encode(le, value, fallback=0):
            try:
                return int(le.transform([value])[0])
            except ValueError:
                return fallback

        encoded = {
            "Crop_Category_encoded":  safe_encode(yield_label_encoders['Crop_Category'], crop_category),
            "Crop_Variety_encoded":   safe_encode(yield_label_encoders['Crop_Variety'], crop_variety),
            "Seed_Type_encoded":      safe_encode(yield_label_encoders['Seed_Type'], seed_type),
            "Soil_Type_encoded":      safe_encode(yield_label_encoders['Soil_Type'], soil_type),
            "Irrigation_Type_encoded": safe_encode(yield_label_encoders['Irrigation_Type'], irrigation_type),
            "Season_encoded":         safe_encode(yield_label_encoders['Season'], season),
            "Previous_Crop_encoded":  safe_encode(yield_label_encoders.get('Previous_Crop', None), "Rice") if 'Previous_Crop' in yield_label_encoders else 5,
        }

        numerical = {
            "Temperature_Avg_C":             temp_avg,
            "Temperature_Min_C":             temp_min,
            "Temperature_Max_C":             temp_max,
            "Rainfall_mm":                   rainfall_mm,
            "Humidity_Percent":              humidity,
            "Sunshine_Hours":                sunshine_hours,
            "Growing_Season_Days":           growing_days,
            "Soil_pH":                       soil_ph,
            "Nitrogen_kg_per_ha":            soil_n,
            "Phosphorus_kg_per_ha":          soil_p,
            "Potassium_kg_per_ha":           soil_k,
            "Organic_Matter_Percent":        3.0,
            "Soil_Moisture_Percent":         60.0,
            "Fertilizer_Nitrogen_kg_per_ha": fert_n,
            "Fertilizer_Phosphorus_kg_per_ha": fert_p,
            "Fertilizer_Potassium_kg_per_ha": fert_k,
            "Pesticide_Usage":               1,
        }

        # Build feature row matching training order
        row = {**encoded, **numerical}
        feature_row = pd.DataFrame([row])[yield_feature_cols]

        # ── Predict ─────────────────────────────────────────────────────────
        predicted_yield = float(yield_model.predict(feature_row)[0])
        predicted_yield = round(max(0, predicted_yield), 3)

        # Estimate total yield and revenue
        farm_size_ha = float(data.get("farm_size_ha", 1.0))  # from frontend
        total_yield_tons = round(predicted_yield * farm_size_ha, 2)

        return jsonify({
            "status": "success",
            "yield_per_ha": predicted_yield,
            "total_yield_tons": total_yield_tons,
            "crop_variety": crop_variety,
            "season": season,
            "inputs_used": {
                "seed_type": seed_type,
                "irrigation_type": irrigation_type,
                "use_fertilizer": use_fertilizer,
                "fertilizer_n": fert_n,
                "fertilizer_p": fert_p,
                "fertilizer_k": fert_k,
                "temp_avg": temp_avg,
                "temp_min": temp_min,
                "temp_max": temp_max,
                "rainfall_mm": rainfall_mm,
                "sunshine_hours": sunshine_hours,
            }
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)