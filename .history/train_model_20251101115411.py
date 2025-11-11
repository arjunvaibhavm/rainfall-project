import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

print("--- Script Started ---")

# 1. Load Data
try:
    df = pd.read_csv('rain_forecasting.csv')
    print("Successfully loaded 'rain_forecasting.csv'")
except FileNotFoundError:
    print("ERROR: 'rain_forecasting.csv' not found.")
    print("Please make sure the file is in the same folder as this script.")
    exit()

# 2. Preprocessing
df['RainToday_Num'] = df['RainToday'].map({'Yes': 1, 'No': 0})
numeric_features = ['MinTemp', 'MaxTemp', 'Humidity9am', 'Humidity3pm', 'Pressure9am', 'Pressure3pm', 'WindSpeed9am', 'WindSpeed3pm']
features = numeric_features + ['RainToday_Num']
X = df[features]
y = df['RainTomorrow'].map({'Yes': 1, 'No': 0})
print("Data preprocessing complete.")

# 3. Split Data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print("Data split into training and testing sets.")

# 4. Scale Data
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)
print("Data scaling complete.")

# --- Save the Scaler ---
# This is CRITICAL for our API
joblib.dump(scaler, 'scaler.pkl')
print("--- 'scaler.pkl' successfully saved! ---")

# 5. Train the Model
print("Training the Random Forest model...")
model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)
print("Model training complete.")

# --- Save the Model ---
# This is the "brain" for our API
joblib.dump(model, 'rainfall_model.pkl')
print("--- 'rainfall_model.pkl' successfully saved! ---")

# 6. Test the Model and Show Accuracy
print("Testing model accuracy...")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print("\n===============================================")
print(f"Model Accuracy: {accuracy * 100:.2f}%")
print("===============================================")
print("--- Script Finished ---")