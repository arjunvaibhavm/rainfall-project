import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import requests
import sqlite3
import json
import time  # Import time for timestamp

# 1. Initialize the Flask app
app = Flask(__name__)
CORS(app)

# 2. Database setup
DB_NAME = 'predictions.db'

def init_db():
    print("Initializing database...")
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        # Add new columns for the new data
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city TEXT NOT NULL,
                live_weather TEXT,
                ml_prediction_result TEXT,
                api_forecast_amount_mm REAL,
                api_forecast_temp REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    print("Database initialized.")

def save_prediction(city, live_weather, ml_result, api_amount, api_temp):
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            weather_json = json.dumps(live_weather)
            cursor.execute('''
                INSERT INTO predictions (city, live_weather, ml_prediction_result, api_forecast_amount_mm, api_forecast_temp)
                VALUES (?, ?, ?, ?, ?)
            ''', (city, weather_json, ml_result, api_amount, api_temp))
            conn.commit()
        print(f"Prediction for {city} saved to database.")
    except Exception as e:
        print(f"Error saving to database: {e}")

# 3. Load our model and scaler
print("Loading model and scaler...")
model = joblib.load('rainfall_model.pkl')
scaler = joblib.load('scaler.pkl')
print("Model and scaler loaded successfully.")

# 4. Store your Weather API Key
WEATHER_API_KEY = "YOUR_SECRET_API_KEY_HERE"  # <-- IMPORTANT: PASTE YOUR KEY HERE
# --- NEW API URL ---
FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast" 

# 5. Define our prediction endpoint
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. Get city name
        data = request.json
        city_name = data['location']
        print(f"Received request for city: {city_name}")

        # 2. Call OpenWeatherMap /forecast API
        params = {
            'q': city_name,
            'appid': WEATHER_API_KEY,
            'units': 'metric'
        }
        response = requests.get(FORECAST_API_URL, params=params)
        forecast_data = response.json()

        # 3. Check for errors
        if forecast_data['cod'] != "200":
            return jsonify({'error': f"City not found: {city_name}"}), 404
        
        # --- Get the *first* forecast (e.g., 3 hours from now) ---
        first_forecast = forecast_data['list'][0]
        print(f"Live forecast data: {first_forecast}")

        # 4. Map data for our ML model
        main_data = first_forecast['main']
        wind_data = first_forecast['wind']
        rain_today_num = 0  # Assume 'No' for 'RainToday' to run our model
        
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
        
        # 5. Make *our ML model's* prediction
        final_features = np.array(features).reshape(1, -1)
        scaled_features = scaler.transform(final_features)
        ml_prediction = model.predict(scaled_features)
        ml_probability = model.predict_proba(scaled_features)[0][ml_prediction[0]]
        
        if ml_prediction[0] == 1:
            ml_result = f"Yes, it will likely rain. (Confidence: {ml_probability*100:.2f}%)"
        else:
            ml_result = f"No, it will likely not rain. (Confidence: {ml_probability*100:.2f}%)"
            
        print(f"Our ML Prediction: {ml_result}")

        # --- NEW: Get forecast data from the API ---
        
        # Get forecasted temperature
        api_forecast_temp = first_forecast['main']['temp']
        
        # Get forecasted rainfall amount. 'rain' key might not exist if 0mm.
        api_forecast_amount_mm = 0.0
        if 'rain' in first_forecast and '3h' in first_forecast['rain']:
            api_forecast_amount_mm = first_forecast['rain']['3h']
            
        print(f"API Forecast: {api_forecast_temp}°C, {api_forecast_amount_mm}mm rain")

        # 6. Save everything to the database
        save_prediction(city_name, first_forecast, ml_result, api_forecast_amount_mm, api_forecast_temp)
        
        # 7. Send *all* data back to React
        return jsonify({
            'ml_prediction_text': ml_result,
            'api_forecast_temp': api_forecast_temp,
            'api_forecast_amount_mm': api_forecast_amount_mm
        })

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

# 6. Run the app
if __name__ == '__main__':
    init_db()  # Initialize the database on startup
    app.run(port=5000, debug=True)
