"""
Post-Harvest NPK Prediction – Evaluation & Graphs
==================================================
Loads the SAME dataset and saved model artefacts used in production,
re-evaluates on the held-out test set (same random_state=42 split),
and produces four publication-quality plots saved alongside the script.

Run:
    python evaluate_npk_model.py
"""

import os
import pickle
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")          # headless backend (no display needed)
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH  = os.path.join(BASE_DIR, "crop_yield_dataset_with_post_harvest_npk (1).csv")
MODEL_PATH    = os.path.join(BASE_DIR, "npk_model.pkl")
SCALER_PATH   = os.path.join(BASE_DIR, "npk_scaler.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "npk_features.pkl")
OUT_DIR       = BASE_DIR          # plots saved here

TARGETS = ["N_post", "P_post", "K_post"]
LABELS  = ["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)"]
COLORS  = ["#4CAF50", "#2196F3", "#FF9800"]   # green / blue / orange

# ── 1. Load dataset ────────────────────────────────────────────────────────────
print("Loading dataset ...")
df = pd.read_csv(DATASET_PATH)
df = df.rename(columns={
    "Post_Harvest_Nitrogen_kg_per_ha":   "N_post",
    "Post_Harvest_Phosphorus_kg_per_ha": "P_post",
    "Post_Harvest_Potassium_kg_per_ha":  "K_post",
})
df = df.dropna(subset=TARGETS)
print(f"  Rows: {len(df):,}  |  Columns: {df.shape[1]}")

X = pd.get_dummies(df.drop(columns=TARGETS), drop_first=True)
y = df[TARGETS]

# ── 2. Reconstruct SAME test split ────────────────────────────────────────────
_, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ── 3. Load saved artefacts ────────────────────────────────────────────────────
print("Loading model artefacts ...")
with open(MODEL_PATH,    "rb") as f: model    = pickle.load(f)
with open(SCALER_PATH,   "rb") as f: scaler   = pickle.load(f)
with open(FEATURES_PATH, "rb") as f: features = pickle.load(f)

# Align columns to training features
X_test_aligned = X_test.reindex(columns=features, fill_value=0)
X_test_s       = scaler.transform(X_test_aligned)

# ── 4. Predict ─────────────────────────────────────────────────────────────────
y_pred = model.predict(X_test_s)

# ── 5. Per-target metrics ──────────────────────────────────────────────────────
metrics = {}
print("\n" + "="*55)
print(f"{'Metric':<22} {'N_post':>10} {'P_post':>10} {'K_post':>10}")
print("="*55)

for i, (col, label) in enumerate(zip(TARGETS, LABELS)):
    yt = y_test.iloc[:, i].values
    yp = y_pred[:, i]
    mae  = mean_absolute_error(yt, yp)
    rmse = np.sqrt(mean_squared_error(yt, yp))
    r2   = r2_score(yt, yp)
    metrics[col] = {"MAE": mae, "RMSE": rmse, "R2": r2}

rows = {
    "MAE":  [metrics[c]["MAE"]  for c in TARGETS],
    "RMSE": [metrics[c]["RMSE"] for c in TARGETS],
    "R²":   [metrics[c]["R2"]   for c in TARGETS],
}
for name, vals in rows.items():
    print(f"{name:<22} {vals[0]:>10.4f} {vals[1]:>10.4f} {vals[2]:>10.4f}")
print("="*55)

overall_mae  = mean_absolute_error(y_test.values, y_pred)
overall_rmse = np.sqrt(mean_squared_error(y_test.values, y_pred))
overall_r2   = r2_score(y_test.values, y_pred)
print(f"\nOverall (multi-output) MAE  : {overall_mae:.4f} kg/ha")
print(f"Overall (multi-output) RMSE : {overall_rmse:.4f} kg/ha")
print(f"Overall (multi-output) R²   : {overall_r2:.4f}")
print("\n  -> Approx. accuracy (1 - norm. MAE) by target:")
for col, label in zip(TARGETS, LABELS):
    rng = y_test[col].max() - y_test[col].min()
    acc = (1 - metrics[col]["MAE"] / rng) * 100
    print(f"     {label:<18}: {acc:.1f} %   (R2 = {metrics[col]['R2']:.4f})")

# ══════════════════════════════════════════════════════════════════════════════
# PLOT 1 – Actual vs Predicted  (3 scatter sub-plots)
# ══════════════════════════════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 3, figsize=(15, 5))
fig.suptitle("Post-Harvest NPK — Actual vs Predicted", fontsize=14, fontweight="bold", y=1.02)

for i, (ax, col, label, color) in enumerate(zip(axes, TARGETS, LABELS, COLORS)):
    yt = y_test.iloc[:, i].values
    yp = y_pred[:, i]

    # sample up to 800 pts so the plot stays readable
    idx = np.random.default_rng(0).choice(len(yt), min(800, len(yt)), replace=False)

    ax.scatter(yt[idx], yp[idx], alpha=0.45, s=18, color=color, edgecolors="none")
    mn, mx = min(yt.min(), yp.min()), max(yt.max(), yp.max())
    ax.plot([mn, mx], [mn, mx], "k--", lw=1.2, label="Perfect fit")
    ax.set_xlabel(f"Actual {label} (kg/ha)", fontsize=10)
    ax.set_ylabel(f"Predicted {label} (kg/ha)", fontsize=10)
    ax.set_title(f"{label}\nR² = {metrics[col]['R2']:.4f}  |  MAE = {metrics[col]['MAE']:.2f}", fontsize=10)
    ax.legend(fontsize=8)
    ax.grid(alpha=0.3)

plt.tight_layout()
p1 = os.path.join(OUT_DIR, "npk_actual_vs_predicted.png")
plt.savefig(p1, dpi=150, bbox_inches="tight")
plt.close()
print(f"\n[Saved] {p1}")

# ══════════════════════════════════════════════════════════════════════════════
# PLOT 2 – Residuals distribution  (3 histograms)
# ══════════════════════════════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
fig.suptitle("Post-Harvest NPK — Residual Distributions", fontsize=14, fontweight="bold")

for ax, col, label, color in zip(axes, TARGETS, LABELS, COLORS):
    i   = TARGETS.index(col)
    res = y_test.iloc[:, i].values - y_pred[:, i]
    ax.hist(res, bins=50, color=color, edgecolor="white", alpha=0.85)
    ax.axvline(0, color="black", linestyle="--", lw=1.2)
    ax.axvline(res.mean(), color="red", linestyle="-", lw=1.2, label=f"Mean={res.mean():.2f}")
    ax.set_xlabel("Residual (kg/ha)", fontsize=10)
    ax.set_ylabel("Count", fontsize=10)
    ax.set_title(f"{label} Residuals", fontsize=10)
    ax.legend(fontsize=8)
    ax.grid(alpha=0.3)

plt.tight_layout()
p2 = os.path.join(OUT_DIR, "npk_residuals.png")
plt.savefig(p2, dpi=150, bbox_inches="tight")
plt.close()
print(f"[Saved] {p2}")

# ══════════════════════════════════════════════════════════════════════════════
# PLOT 3 – Metrics bar-chart (MAE, RMSE, R²)
# ══════════════════════════════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
fig.suptitle("Post-Harvest NPK — Model Performance Metrics", fontsize=14, fontweight="bold")
short = ["N", "P", "K"]

for ax, metric_name in zip(axes, ["MAE", "RMSE", "R²"]):
    vals = [metrics[c][metric_name if metric_name != "R²" else "R2"] for c in TARGETS]
    bars = ax.bar(short, vals, color=COLORS, edgecolor="white", width=0.5)
    ax.bar_label(bars, fmt="%.4f", fontsize=9, padding=3)
    ax.set_title(metric_name, fontsize=11, fontweight="bold")
    ax.set_ylabel(metric_name, fontsize=10)
    ax.set_ylim(0, max(vals) * 1.25)
    ax.grid(axis="y", alpha=0.3)
    ax.set_xticks([0, 1, 2])
    ax.set_xticklabels(["Nitrogen", "Phosphorus", "Potassium"], fontsize=9)

plt.tight_layout()
p3 = os.path.join(OUT_DIR, "npk_metrics_bar.png")
plt.savefig(p3, dpi=150, bbox_inches="tight")
plt.close()
print(f"[Saved] {p3}")

# ══════════════════════════════════════════════════════════════════════════════
# PLOT 4 – Feature Importances (top-20 per target)
# ══════════════════════════════════════════════════════════════════════════════
fig = plt.figure(figsize=(18, 12))
gs  = gridspec.GridSpec(1, 3, figure=fig, wspace=0.5)
fig.suptitle("Post-Harvest NPK — Top-20 Feature Importances\n(Random Forest)", fontsize=14, fontweight="bold")

for i, (col, label, color) in enumerate(zip(TARGETS, LABELS, COLORS)):
    sub_model   = model.estimators_[i]
    importances = sub_model.feature_importances_
    top20_idx   = np.argsort(importances)[::-1][:20]
    top20_imp   = importances[top20_idx]
    top20_feat  = [features[j] for j in top20_idx]

    ax = fig.add_subplot(gs[i])
    ax.barh(range(20), top20_imp[::-1], color=color, edgecolor="white", alpha=0.85)
    ax.set_yticks(range(20))
    ax.set_yticklabels([f[:28] for f in top20_feat[::-1]], fontsize=7)
    ax.set_xlabel("Importance", fontsize=9)
    ax.set_title(f"{label}", fontsize=10, fontweight="bold")
    ax.grid(axis="x", alpha=0.3)

p4 = os.path.join(OUT_DIR, "npk_feature_importances.png")
plt.savefig(p4, dpi=150, bbox_inches="tight")
plt.close()
print(f"[Saved] {p4}")

print("\nAll done! 4 plots written to:", OUT_DIR)
