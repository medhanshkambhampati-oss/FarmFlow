from fastapi import FastAPI
import pandas as pd
import numpy as np
import joblib

app = FastAPI()


model = joblib.load("crop_model.pkl")

crop_economics = {
    'rice': {'cost': 32000, 'profit': 22000, 'safety': 10},
    'maize': {'cost': 18000, 'profit': 18000, 'safety': 8},
    'chickpea': {'cost': 16000, 'profit': 25000, 'safety': 7},
    'watermelon': {'cost': 14000, 'profit': 45000, 'safety': 4},
    'mango': {'cost': 55000, 'profit': 120000, 'safety': 3},
    'apple': {'cost': 180000, 'profit': 450000, 'safety': 2},
    'cotton': {'cost': 38000, 'profit': 42000, 'safety': 9},
    'lentil': {'cost': 14000, 'profit': 24000, 'safety': 7},
    'coffee': {'cost': 75000, 'profit': 150000, 'safety': 5},
    'default': {'cost': 25000, 'profit': 20000, 'safety': 5}
}

def get_recommendations(n, p, k, temp, hum, ph, rain, month):
    s_code = 0 if 6 <= month <= 10 else 1 if (month >= 11 or month <= 2) else 2

    df = pd.DataFrame([[n, p, k, temp, hum, ph, rain, s_code]],
                      columns=['N','P','K','temperature','humidity','ph','rainfall','season_encoded'])

    probs = model.predict_proba(df)[0]
    crops = model.classes_

    top_idx = np.argsort(probs)[-5:][::-1]

    candidates = []
    for i in top_idx:
        crop = crops[i]
        econ = crop_economics.get(crop, crop_economics['default'])
        candidates.append({
            "crop": crop,
            "prob": float(probs[i]),
            "cost": econ['cost'],
            "profit": econ['profit'],
            "safety": econ['safety']
        })

    safest = max(candidates, key=lambda x: x['prob'] * x['safety'])
    cheapest = min(candidates, key=lambda x: x['cost'])
    profitable = max(candidates, key=lambda x: x['profit'])

    return {
        "safest": safest,
        "cheapest": cheapest,
        "profitable": profitable,
        "all": candidates
    }

@app.post("/predict")
def predict(data: dict):
    res = get_recommendations(**data)
    return res