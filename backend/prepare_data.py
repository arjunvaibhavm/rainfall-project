import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

DATA_FILE = 'rain_forecasting.csv'
SCALER_FILE = 'plan_a_scaler.pkl'

print(f"Loading '{DATA_FILE}' for data preparation...")

try:
    df = pd.read_csv(DATA_FILE)
except FileNotFoundError:
    print(f"Error: '{DATA_FILE}' not found.")
    exit()

# 1. Preprocessing
df['RainToday_Num'] = df['RainToday'].map({'Yes': 1, 'No': 0})
numeric_features = ['MinTemp', 'MaxTemp', 'Humidity9am', 'Humidity3pm', 'Pressure9am', 'Pressure3pm', 'WindSpeed9am', 'WindSpeed3pm']
features = numeric_features + ['RainToday_Num']

X = df[features]
y = df['RainTomorrow'].map({'Yes': 1, 'No': 0})
print("Data preprocessing complete (Yes/No converted to 1/0).")

# 2. Split Data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print("Data split into 80% Training and 20% Testing sets.")

# 3. Scale Data
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)
print("Data scaling complete (using StandardScaler).")

# 4. Save the scaler (CRITICAL for our app)
joblib.dump(scaler, SCALER_FILE)
print(f"Successfully saved scaler to '{SCALER_FILE}'")

# 5. Save the prepared data arrays
np.save('plan_a_X_train.npy', X_train)
np.save('plan_a_y_train.npy', y_train)
np.save('plan_a_X_test.npy', X_test)
np.save('plan_a_y_test.npy', y_test)

print("Successfully saved all .npy data files.")
print("--- Data Preparation Complete ---")