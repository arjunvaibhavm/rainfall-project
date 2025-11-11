import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

MODEL_FILE = 'plan_a_model.pkl'

print("Loading prepared data files (.npy)...")
try:
    X_train = np.load('plan_a_X_train.npy')
    y_train = np.load('plan_a_y_train.npy')
    X_test = np.load('plan_a_X_test.npy')
    y_test = np.load('plan_a_y_test.npy')
except FileNotFoundError:
    print("Error: .npy files not found. Please run 'plan_a_step_2_prepare_data.py' first.")
    exit()

print("Data loaded.")

# 1. Define and Train the Model
print("Training the Random Forest model...")
model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)
print("Model training complete.")

# 2. Save the Trained Model (CRITICAL for our app)
joblib.dump(model, MODEL_FILE)
print(f"Successfully saved trained model to '{MODEL_FILE}'")

# 3. Evaluate the Model
print("\n--- Model Evaluation ---")
print("Making predictions on the test set...")
y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
print(f"\nModel Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['No Rain (0)', 'Rain (1)']))
print("--- Script Finished ---")


# ---

# ### Step 3: Run Your New Scripts

# You can now run these scripts **in order**.

# 1.  **Run first:** `python plan_a_step_1_visualize.py` (This creates `plan_a_visualization.png`)
# 2.  **Run second:** `python plan_a_step_2_prepare_data.py` (This creates the `.npy` files and `plan_a_scaler.pkl`)
# 3.  **Run third:** `python plan_a_step_3_train_model.py` (This creates `plan_a_model.pkl` and prints your accuracy)

# ---

# ### Step 4: Final Update (CRITICAL)

# You have now created two new, better model files:
# * `plan_a_model.pkl`
# * `plan_a_scaler.pkl`

# Your `backend/app.py` is still looking for the *old* files (`rainfall_model.pkl` and `scaler.pkl`). We must update it.

# 1.  **Move the new files:**
#     * Move your new `plan_a_model.pkl` into your `rainfall-project/backend/` folder.
#     * Move your new `plan_a_scaler.pkl` into your `rainfall-project/backend/` folder.
#     (You can delete the old `rainfall_model.pkl` and `scaler.pkl` to avoid confusion).

# 2.  **Edit `backend/app.py`:**
#     Open your `backend/app.py` (the one with the dark desktop UI).
#     Find these two lines near the top:
#     ```python
#     model = joblib.load('rainfall_model.pkl')
#     scaler = joblib.load('scaler.pkl')
#     ```
#     And change them to point to your new files:
#     ```python
#     model = joblib.load('plan_a_model.pkl')
#     scaler = joblib.load('plan_a_scaler.pkl')