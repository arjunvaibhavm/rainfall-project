import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import requests
import sqlite3
import json

app = Flask(__name__)
CORS(app)

DB_NAME = 'predictions.db'

# --- NEW HELPER FUNCTION ---
def classify_rainfall(mm_3hr):
    """Classifies rainfall amount into intensity and impact."""
    
    # These are based on meteorological standards, adjusted for a 3-hour period
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
# --- END OF NEW FUNCTION ---

def init_db():
    print("Initializing database...")
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
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
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    print("Database initialized.")

def save_prediction(data):
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            weather_json = json.dumps(data['live_weather'])
            cursor.execute('''
                INSERT INTO predictions (city, live_weather, ml_prediction_text, 
                                     api_forecast_temp, api_forecast_amount_mm, 
                                     intensity_tag, impact_index)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (data['city'], weather_json, data['ml_prediction_text'],
                  data['api_forecast_temp'], data['api_forecast_amount_mm'],
                  data['intensity_tag'], data['impact_index']))
            conn.commit()
        print(f"Prediction for {data['city']} saved to database.")
    except Exception as e:
        print(f"Error saving to database: {e}")


print("Loading model and scaler...")
model = joblib.load('rainfall_model.pkl')
scaler = joblib.load('scaler.pkl')
print("Model and scaler loaded successfully.")

WEATHER_API_KEY = "YOUR_API_KEY_HERE"  # <-- IMPORTANT: PASTE YOUR KEY HERE
FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        city_name = data['location']
        print(f"Received request for city: {city_name}")

        params = {
            'q': city_name,
            'appid': b26abbbb1641a44c12cfa7c7a78c3fd1
,
            'units': 'metric',
            'cnt': 1  # Get just the next 3-hour forecast
        }
        response = requests.get(FORECAST_API_URL, params=params)
        forecast_data = response.json()

        if forecast_data['cod'] != '200':
            return jsonify({'error': f"City not found: {city_name}"}), 404

        print(f"Live forecast data: {forecast_data}")
        
        forecast = forecast_data['list'][0]
        main_data = forecast['main']
        wind_data = forecast['wind']
        
        # Get forecasted rain amount (it might be missing, so default to 0)
        api_forecast_amount_mm = 0.0
        if 'rain' in forecast and '3h' in forecast['rain']:
            api_forecast_amount_mm = forecast['rain']['3h']
        
        api_forecast_temp = main_data['temp']
        rain_today_num = 1 if api_forecast_amount_mm > 0 else 0
        
        features = [
            main_data.get('temp_min', main_data['temp']),
            main_data.get('temp_max', main_data['temp']),
            main_data.get('humidity', 70),
            main_data.get('humidity', 50),
            main_data.get('pressure', 1010),
            main_data.get('pressure', 1008),
            wind_data.get('speed', 10),
            wind_data.get('speed', 15),
            rain_today_num
        ]
        
        final_features = np.array(features).reshape(1, -1)
        scaled_features = scaler.transform(final_features)
        
        prediction = model.predict(scaled_features)
        probability = model.predict_proba(scaled_features)[0][prediction[0]]
        
        if prediction[0] == 1:
            ml_result = f"Model predicts RAIN (Confidence: {probability*100:.2f}%)"
        else:
            ml_result = f"Model predicts NO RAIN (Confidence: {probability*100:.2f}%)"
            
        print(f"ML Prediction: {ml_result}")
        
        # --- NEW: Classify the rain ---
        intensity, impact = classify_rainfall(api_forecast_amount_mm)
        
        # --- NEW: Build the final data package ---
        prediction_data = {
            'city': city_name,
            'live_weather': forecast_data,
            'ml_prediction_text': ml_result,
            'api_forecast_temp': api_forecast_temp,
            'api_forecast_amount_mm': api_forecast_amount_mm,
            'intensity_tag': intensity,
            'impact_index': impact
        }
        
        # --- NEW: Save the full package to DB ---
        save_prediction(prediction_data)
        
        # --- NEW: Send the full package to React ---
        return jsonify(prediction_data)

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()  
    app.run(port=5000, debug=True)

