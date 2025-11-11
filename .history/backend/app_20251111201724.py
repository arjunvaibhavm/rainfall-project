import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import requests
import sqlite3  # <-- DATABASE IS HERE
import json     # <-- DATABASE IS HERE

app = Flask(__name__)
CORS(app)

# --- Database file ---
DB_NAME = 'predictions.db'

# --- HELPER FUNCTION ---
def classify_rainfall(mm_3hr):
    """Classifies rainfall amount into intensity and impact."""
    if mm_3hr <= 0:
        intensity = "No Rain"
        impact = "No Impact."
    elif mm_3hr < 1.0:
        intensity = "Light Drizzle"
        impact = "Low Impact (e.g., good for plants)."
    elif mm_3hr < 4.0:
        intensity = "Light Rain"
        impact = "Low Impact (e.g., roads are wet)."
    elif mm_3hr < 15.0:
        intensity = "Moderate Rain"
        impact = "Medium Impact (e.g., commuter delays, affect outdoor plans)."
    elif mm_3hr < 50.0:
        intensity = "Heavy Rain"
        impact = "High Impact (e.g., risk of local flooding, check alerts)."
    else:
        intensity = "Very Heavy Rain / Downpour"
        impact = "Severe Impact (e.g., high flood risk, avoid travel if possible)."
    return intensity, impact

# --- DATABASE FUNCTION 1: Creates the DB table ---
def init_db():
    print("Initializing database...")
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        # --- Database with all columns ---
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city TEXT NOT NULL,
                live_weather TEXT,
                ml_prediction_text TEXT,
                api_forecast_temp REAL,
                api_forecast_amount_mm REAL,
                intensity_tag TEXT,
                impact_index TEXT,
                api_feels_like REAL,
                api_humidity REAL,
                api_wind_speed REAL,
                api_pop REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    print("Database initialized.")

# --- DATABASE FUNCTION 2: Saves the prediction ---
def save_prediction(data):
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            weather_json = json.dumps(data['live_weather'])
            # --- Save all data to the DB ---
            cursor.execute('''
                INSERT INTO predictions (city, live_weather, ml_prediction_text, 
                                     api_forecast_temp, api_forecast_amount_mm, 
                                     intensity_tag, impact_index,
                                     api_feels_like, api_humidity, api_wind_speed, api_pop)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (data['city'], weather_json, data['ml_prediction_text'],
                  data['api_forecast_temp'], data['api_forecast_amount_mm'],
                  data['intensity_tag'], data['impact_index'],
                  data['api_feels_like'], data['api_humidity'], 
                  data['api_wind_speed'], data['api_pop']))
            conn.commit()
        print(f"Prediction for {data['city']} saved to database.")
    except Exception as e:
        print(f"Error saving to database: {e}")

print("Loading model and scaler...")
# --- Loads your Plan A model files ---
model = joblib.load('plan_a_model.pkl')
scaler = joblib.load('plan_a_scaler.pkl')
print("Model and scaler loaded successfully.")

WEATHER_API_KEY = "b26abbbb1641a44c12cfa7c7a78c3fd1"  # <-- IMPORTANT: PASTE YOUR KEY HERE
FORECAST_API_URL = "https.api.openweathermap.org/data/2.5/forecast"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        city_name = data['location']
        
        # --- THIS IS THE MISSING BLOCK ---
        # Define the parameters for the API call
        params = {
            'q': city_name,
            'appid': WEATHER_API_KEY,
            'units': 'metric',  # Use 'metric' for Celsius, 'imperial' for Fahrenheit
            'cnt': 1  # We only need the very next forecast (for the next 3 hours)
        }
        # --- END OF MISSING BLOCK ---

# ... (API call code) ...
        print(f"Calling API with params: {params}") # Added a print statement for debugging
        response = requests.get(FORECAST_API_URL, params=params)
        forecast_data = response.json()
# ... existing code ...

        if forecast_data['cod'] != '200':
            return jsonify({'error': f"City not found: {city_name}"}), 404

        print(f"Live forecast data: {forecast_data}")
        
        forecast = forecast_data['list'][0]
# ... (data extraction code) ...
        
        # --- Build the final data package for the frontend ---
        prediction_data = {
            'city': city_name,
            'live_weather': forecast_data, 
            'ml_prediction_text': ml_result,
            'api_forecast_temp': api_forecast_temp,
            'api_forecast_amount_mm': api_forecast_amount_mm,
            'intensity_tag': intensity,
            'impact_index': impact,
            'api_feels_like': api_feels_like,
            'api_humidity': api_humidity,
            'api_wind_speed': api_wind_speed,
            'api_pop': api_pop
        }
        
        # --- DATABASE FUNCTION 3: Call the save function ---
        save_prediction(prediction_data)
        
        return jsonify(prediction_data)

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # --- DATABASE FUNCTION 4: Initialize DB on start ---
    init_db()  
    app.run(port=5000, debug=True)
    # ... existing code ...
