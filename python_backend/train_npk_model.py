"""
Post-Harvest NPK Prediction Model Training Script
Uses: crop_yield_dataset_with_post_harvest_npk (1).csv
Model: MultiOutputRegressor(RandomForestRegressor)
Outputs: npk_model.pkl, npk_scaler.pkl, npk_features.pkl
"""

import pandas as pd
import numpy as np
import pickle
import os

from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score

# ===============================
# 1. PATHS
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "crop_yield_dataset_with_post_harvest_npk (1).csv")

# ===============================
# 2. LOAD DATASET
# ===============================
print(f"Loading dataset from: {DATASET_PATH}")
df = pd.read_csv(DATASET_PATH)

print(f"\nColumns:\n{df.columns.tolist()}")
print(f"\nShape: {df.shape}")
print(f"\nPreview:\n{df.head(2)}")

# ===============================
# 3. RENAME TARGET COLUMNS
# ===============================
df = df.rename(columns={
    "Post_Harvest_Nitrogen_kg_per_ha":   "N_post",
    "Post_Harvest_Phosphorus_kg_per_ha": "P_post",
    "Post_Harvest_Potassium_kg_per_ha":  "K_post"
})

# ===============================
# 4. DEFINE TARGET & FEATURES
# ===============================
TARGET_COLUMNS = ["N_post", "P_post", "K_post"]

for col in TARGET_COLUMNS:
    if col not in df.columns:
        raise ValueError(f"Missing target column: {col}")

df = df.dropna(subset=TARGET_COLUMNS)
print(f"\nRows after dropna: {len(df)}")

X = df.drop(columns=TARGET_COLUMNS)
y = df[TARGET_COLUMNS]

# ===============================
# 5. HANDLE CATEGORICAL DATA
# ===============================
X = pd.get_dummies(X, drop_first=True)
feature_columns = X.columns.tolist()
print(f"\nFeature count: {len(feature_columns)}")
print(f"Features: {feature_columns}")

# ===============================
# 6. TRAIN / TEST SPLIT
# ===============================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ===============================
# 7. FEATURE SCALING
# ===============================
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

# ===============================
# 8. MODEL TRAINING
# ===============================
print("\nTraining model...")
model = MultiOutputRegressor(
    RandomForestRegressor(
        n_estimators=300,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )
)
model.fit(X_train_s, y_train)
print("[OK] Model trained successfully")

# ===============================
# 9. EVALUATION
# ===============================
y_pred = model.predict(X_test_s)
mae = mean_absolute_error(y_test, y_pred)
r2  = r2_score(y_test, y_pred)

print("\n[METRICS] Evaluation:")
print(f"   MAE      : {mae:.4f}")
print(f"   R2 Score : {r2:.4f}")

# Per-output R2
for i, col in enumerate(TARGET_COLUMNS):
    r2_i = r2_score(y_test.iloc[:, i], y_pred[:, i])
    print(f"   R2 ({col}) : {r2_i:.4f}")

# ===============================
# 10. SAVE MODEL FILES
# ===============================
model_path    = os.path.join(BASE_DIR, "npk_model.pkl")
scaler_path   = os.path.join(BASE_DIR, "npk_scaler.pkl")
features_path = os.path.join(BASE_DIR, "npk_features.pkl")

with open(model_path,    "wb") as f: pickle.dump(model,           f)
with open(scaler_path,   "wb") as f: pickle.dump(scaler,          f)
with open(features_path, "wb") as f: pickle.dump(feature_columns, f)

print("\n[OK] Saved model files:")
print(f"   {model_path}")
print(f"   {scaler_path}")
print(f"   {features_path}")
