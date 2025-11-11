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

def init_db():
    print("Initializing database...")
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city TEXT NOT NULL,
                live_weather TEXT,
                prediction_result TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    print("Database initialized.")

def save_prediction(city, live_weather, result):
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            weather_json = json.dumps(live_weather)
            cursor.execute('''
                INSERT INTO predictions (city, live_weather, prediction_result)
                VALUES (?, ?, ?)
            ''', (city, weather_json, result))
            conn.commit()
        print(f"Prediction for {city} saved to database.")
    except Exception as e:
        print(f"Error saving to database: {e}")

print("Loading model and scaler...")
model = joblib.load('rainfall_model.pkl')
scaler = joblib.load('scaler.pkl')
print("Model and scaler loaded successfully.")

# ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
# PASTE YOUR *NEW* SECRET KEY ON THIS LINE
WEATHER_API_KEY = "PUT_YOUR_NEW_SECRET_KEY_HERE" 
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        city_name = data['location']
        print(f"Received request for city: {city_name}")

        params = {
            'q': city_name,
            'appid': WEATHER_API_KEY, # It will use the key from above
            'units': 'metric'
        }
        response = requests.get(WEATHER_API_URL, params=params)
        weather_data = response.json()

        if weather_data['cod'] != 200:
            return jsonify({'error': f"City not found: {city_name}"}), 404
        print(f"Live weather data: {weather_data}")

        main_data = weather_data['main']
        wind_data = weather_data['wind']
        rain_today_num = 0 
        
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
        print(f"Features for model: {features}")
        
        final_features = np.array(features).reshape(1, -1)
        scaled_features = scaler.transform(final_features)
        prediction = model.predict(scaled_features)
        probability = model.predict_proba(scaled_features)[0][prediction[0]]
        
        if prediction[0] == 1:
            result = f"Yes, it will likely rain. (Confidence: {probability*100:.2f}%)"
        else:
            result = f"No, it will likely not rain. (Confidence: {probability*100:.2f}%)"
            
        print(f"Prediction: {result}")
        
        save_prediction(city_name, weather_data, result)
        
        return jsonify({'prediction_text': result})

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()  
    app.run(port=5000, debug=True)