"""
Train XGBoost yield prediction model from crop_yield_dataset_final.csv
Run this once to generate crop_yield_model.pkl and yield_label_encoders.pkl
"""
import pandas as pd
import numpy as np
import joblib
import pickle
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import xgboost as xgb

print("Loading dataset...")
df = pd.read_csv('crop_yield_dataset_final.csv')
print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")

df_processed = df.copy()

categorical_cols = ['Crop_Category', 'Crop_Variety', 'Seed_Type', 'Soil_Type',
                   'Irrigation_Type', 'Season']

# Check if Previous_Crop exists
if 'Previous_Crop' in df.columns:
    categorical_cols.append('Previous_Crop')

numerical_cols = ['Temperature_Avg_C', 'Temperature_Min_C', 'Temperature_Max_C',
                 'Rainfall_mm', 'Humidity_Percent', 'Sunshine_Hours',
                 'Growing_Season_Days', 'Soil_pH', 'Nitrogen_kg_per_ha',
                 'Phosphorus_kg_per_ha', 'Potassium_kg_per_ha',
                 'Organic_Matter_Percent', 'Soil_Moisture_Percent',
                 'Fertilizer_Nitrogen_kg_per_ha',
                 'Fertilizer_Phosphorus_kg_per_ha', 'Fertilizer_Potassium_kg_per_ha']

# Add Pesticide_Usage if exists
if 'Pesticide_Usage' in df.columns:
    numerical_cols.append('Pesticide_Usage')

label_encoders = {}
for col in categorical_cols:
    if col in df_processed.columns:
        le = LabelEncoder()
        df_processed[col + '_encoded'] = le.fit_transform(df_processed[col])
        label_encoders[col] = le
        print(f"  Encoded {col}: {len(le.classes_)} unique values -> {list(le.classes_)}")

feature_cols = []
for col in categorical_cols:
    if col in df_processed.columns:
        feature_cols.append(col + '_encoded')

for col in numerical_cols:
    if col in df_processed.columns:
        feature_cols.append(col)

print(f"\nFeature columns ({len(feature_cols)}): {feature_cols}")

X = df_processed[feature_cols]
y = df_processed['Yield_tons_per_ha']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)

print(f"\nTraining set: {X_train.shape}, Test set: {X_test.shape}")
print("\nTraining XGBoost model...")

model = xgb.XGBRegressor(
    n_estimators=500,
    max_depth=5,
    learning_rate=0.03,
    subsample=0.7,
    colsample_bytree=0.7,
    min_child_weight=5,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    n_jobs=-1,
    verbosity=0
)

model.fit(X_train, y_train)
print("[OK] Model trained successfully")

y_pred_test = model.predict(X_test)
test_r2   = r2_score(y_test, y_pred_test)
test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
test_mae  = mean_absolute_error(y_test, y_pred_test)

print(f"\nTest R2  : {test_r2:.4f}")
print(f"Test RMSE: {test_rmse:.4f}")
print(f"Test MAE : {test_mae:.4f}")

# Save model and encoders
joblib.dump(model, 'crop_yield_model.pkl')
with open('yield_label_encoders.pkl', 'wb') as f:
    pickle.dump(label_encoders, f)
with open('yield_feature_cols.pkl', 'wb') as f:
    pickle.dump(feature_cols, f)

print("\n[OK] Saved: crop_yield_model.pkl")
print("[OK] Saved: yield_label_encoders.pkl")
print("[OK] Saved: yield_feature_cols.pkl")
print("\nDone! You can now start app.py")
