from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os
import pickle
from typing import Any
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Paths removed as they were unused and hardcoded


model = joblib.load("crop_model.pkl")

crop_economics = {
    'rice':       {'cost': 32000, 'profit': 22000, 'safety': 10},
    'maize':      {'cost': 18000, 'profit': 18000, 'safety': 8},
    'chickpea':   {'cost': 16000, 'profit': 25000, 'safety': 7},
    'watermelon': {'cost': 14000, 'profit': 45000, 'safety': 4},
    'mango':      {'cost': 55000, 'profit': 120000, 'safety': 3},
    'apple':      {'cost': 180000, 'profit': 450000, 'safety': 2},
    'cotton':     {'cost': 38000, 'profit': 42000, 'safety': 9},
    'lentil':     {'cost': 14000, 'profit': 24000, 'safety': 7},
    'coffee':     {'cost': 75000, 'profit': 150000, 'safety': 5},
    'kidneybeans':{'cost': 15000, 'profit': 28000, 'safety': 6},
    'pigeonpeas': {'cost': 13000, 'profit': 22000, 'safety': 7},
    'mothbeans':  {'cost': 11000, 'profit': 18000, 'safety': 6},
    'mungbean':   {'cost': 12000, 'profit': 20000, 'safety': 7},
    'blackgram':  {'cost': 13000, 'profit': 21000, 'safety': 7},
    'jute':       {'cost': 20000, 'profit': 25000, 'safety': 8},
    'coconut':    {'cost': 40000, 'profit': 80000, 'safety': 6},
    'papaya':     {'cost': 35000, 'profit': 70000, 'safety': 4},
    'orange':     {'cost': 50000, 'profit': 90000, 'safety': 5},
    'grapes':     {'cost': 120000, 'profit': 250000, 'safety': 3},
    'banana':     {'cost': 45000, 'profit': 85000, 'safety': 5},
    'pomegranate':{'cost': 60000, 'profit': 110000, 'safety': 4},
    'default':    {'cost': 25000, 'profit': 20000, 'safety': 5}
}


def get_diverse_recommendations(n, p, k, temperature, humidity, ph, rainfall, month=None):
    """Get top 5 crop candidates with 3 recommendation strategies."""
    
    if month is None:
        from datetime import datetime
        month = datetime.now().month
    
    if 6 <= month <= 10:
        s_code = 0  
    elif month >= 11 or month <= 2:
        s_code = 1  
    else:
        s_code = 2  


    feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    input_df = pd.DataFrame([[n, p, k, temperature, humidity, ph, rainfall]], columns=feature_names)


    probs = model.predict_proba(input_df)[0]
    all_crops = model.classes_


    top_indices = np.argsort(probs)[-5:][::-1]
    candidates = []

    for idx in top_indices:
        crop_name = all_crops[idx]
        econ = crop_economics.get(crop_name, crop_economics['default'])
        candidates.append({
            'crop': crop_name,
            'suitability': round(float(probs[idx]) * 100, 1),
            'cost': econ['cost'],
            'profit': econ['profit'],
            'safety': econ['safety'],
            'reliability': round(float(probs[idx]) * econ['safety'] * 10, 1)
        })


    safest = max(candidates, key=lambda x: x['suitability'] * x['safety'])
    cheapest = min(candidates, key=lambda x: x['cost'])
    profitable = max(candidates, key=lambda x: x['profit'])

    season_name = ['Kharif (Monsoon)', 'Rabi (Winter)', 'Zaid (Summer)'][s_code]

    return {
        "safest": {
            "crop": safest['crop'],
            "suitability": safest['suitability'],
            "cost": safest['cost'],
            "profit": safest['profit'],
            "safety": safest['safety']
        },
        "cheapest": {
            "crop": cheapest['crop'],
            "suitability": cheapest['suitability'],
            "cost": cheapest['cost'],
            "profit": cheapest['profit'],
            "safety": cheapest['safety']
        },
        "profitable": {
            "crop": profitable['crop'],
            "suitability": profitable['suitability'],
            "cost": profitable['cost'],
            "profit": profitable['profit'],
            "safety": profitable['safety']
        },
        "allCandidates": candidates,
        "season": season_name
    }


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    print("Received data:", data)

    N = data["N"]
    P = data["P"]
    K = data["K"]
    temperature = data["temperature"]
    humidity = data["humidity"]
    ph = data["ph"]
    rainfall = data["rainfall"]
    month = data.get("month", None)

    result = get_diverse_recommendations(N, P, K, temperature, humidity, ph, rainfall, month)

    return jsonify(result)


# Crop nutrient consumption estimates (kg/ha consumed by each crop)
crop_nutrient_consumption = {
    'rice':       {'n': 60, 'p': 15, 'k': 40},
    'maize':      {'n': 80, 'p': 20, 'k': 50},
    'chickpea':   {'n': -20, 'p': 10, 'k': 15},   # legume, fixes nitrogen
    'watermelon': {'n': 50, 'p': 12, 'k': 60},
    'mango':      {'n': 40, 'p': 10, 'k': 35},
    'apple':      {'n': 35, 'p': 8, 'k': 30},
    'cotton':     {'n': 70, 'p': 25, 'k': 45},
    'lentil':     {'n': -15, 'p': 8, 'k': 12},     # legume, fixes nitrogen
    'coffee':     {'n': 45, 'p': 10, 'k': 40},
    'kidneybeans':{'n': -10, 'p': 10, 'k': 20},    # legume
    'pigeonpeas': {'n': -25, 'p': 8, 'k': 15},     # legume
    'mothbeans':  {'n': -12, 'p': 6, 'k': 10},     # legume
    'mungbean':   {'n': -18, 'p': 7, 'k': 12},     # legume
    'blackgram':  {'n': -15, 'p': 8, 'k': 14},     # legume
    'jute':       {'n': 55, 'p': 12, 'k': 35},
    'coconut':    {'n': 30, 'p': 8, 'k': 50},
    'papaya':     {'n': 45, 'p': 15, 'k': 55},
    'orange':     {'n': 35, 'p': 10, 'k': 40},
    'grapes':     {'n': 40, 'p': 12, 'k': 45},
    'banana':     {'n': 50, 'p': 12, 'k': 60},
    'pomegranate':{'n': 30, 'p': 8, 'k': 35},
}


@app.route("/predict_post_harvest", methods=["POST"])
def predict_post_harvest():
    """Predict post-harvest NPK values after growing a specific crop."""
    data = request.json
    print("Post-harvest prediction request:", data)

    crop = data.get("crop", "").lower().strip()
    current_n = float(data.get("n", 0))
    current_p = float(data.get("p", 0))
    current_k = float(data.get("k", 0))

    # Get crop-specific consumption or default
    consumption = crop_nutrient_consumption.get(crop, {'n': 40, 'p': 10, 'k': 30})

    # Calculate post-harvest NPK (current - consumed, minimum 0)
    nn = max(0, round(current_n - consumption['n'], 2))
    np_val = max(0, round(current_p - consumption['p'], 2))
    nk = max(0, round(current_k - consumption['k'], 2))

    result = {
        "crop": crop,
        "pre_n": current_n,
        "pre_p": current_p,
        "pre_k": current_k,
        "nn": nn,
        "np": np_val,
        "nk": nk,
        "consumed": consumption
    }

    print("Post-harvest result:", result)
    return jsonify(result)


if __name__ == "__main__":
    app.run(port=5000, debug=True)