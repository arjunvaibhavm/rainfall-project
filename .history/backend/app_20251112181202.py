import os
import json
import datetime
import random
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import requests

# --- Configuration ---
WEATHER_API_KEY = "b26abbbb1641a44c12cfa7c7a78c3fd1" 

if WEATHER_API_KEY == "YOUR_API_KEY_GOES_HERE" and not os.environ.get('DATABASE_URL'):
    print("="*50)
    print("WARNING: Please replace 'YOUR_API_KEY_GOES_HERE' in app.py")
    print("="*50)

WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/forecast"

# --- App & Database Setup ---
app = Flask(__name__)
CORS(app) 

# --- DATABASE CONFIGURATION ---
prod_db_url = os.environ.get('DATABASE_URL')
if prod_db_url:
    if prod_db_url.startswith("postgres://"):
        prod_db_url = prod_db_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = prod_db_url
    print("Connecting to production PostgreSQL database...")
else:
    basedir = os.path.abspath(os.path.dirname(__file__))
    local_db_path = os.path.join(basedir, 'predictions.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + local_db_path
    print(f"Connecting to local SQLite database at {local_db_path}...")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Database Model ---
class Prediction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    city = db.Column(db.Text, nullable=False)
    live_weather = db.Column(db.Text, nullable=False) 
    ml_prediction_text = db.Column(db.Text, nullable=True)
    api_forecast_temp = db.Column(db.REAL, nullable=True)
    api_forecast_amount_mm = db.Column(db.REAL, nullable=True)
    intensity_tag = db.Column(db.Text, nullable=True)
    impact_index = db.Column(db.Text, nullable=True)
    api_feels_like = db.Column(db.REAL, nullable=True)
    api_humidity = db.Column(db.REAL, nullable=True)
    api_wind_speed = db.Column(db.REAL, nullable=True)
    api_pop = db.Column(db.REAL, nullable=True) 
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # --- NEW ---
    # New column to store the recommendation text
    activity_recommendation = db.Column(db.Text, nullable=True)

    def to_dict(self):
        live_weather_data = {}
        try:
            live_weather_data = json.loads(self.live_weather)
        except json.JSONDecodeError:
            print(f"Error decoding JSON for prediction ID {self.id}")
            live_weather_data = {"error": "Could not parse stored weather data."}

        return {
            "id": self.id,
            "city": self.city,
            "live_weather": live_weather_data, 
            "ml_prediction_text": self.ml_prediction_text,
            "api_forecast_temp": self.api_forecast_temp,
            "api_forecast_amount_mm": self.api_forecast_amount_mm,
            "intensity_tag": self.intensity_tag,
            "impact_index": self.impact_index,
            "api_feels_like": self.api_feels_like,
            "api_humidity": self.api_humidity,
            "api_wind_speed": self.api_wind_speed,
            "api_pop": self.api_pop,
            "timestamp": self.timestamp.isoformat(),
            # --- NEW ---
            "activity_recommendation": self.activity_recommendation 
        }

# --- API Routes ---

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'city' not in data:
        return jsonify({"error": "City is required"}), 400

    city = data['city']
    # --- NEW ---
    # Get the activity from the frontend, default to 'none' if not provided
    activity = data.get('activity', 'none')
    
    if not WEATHER_API_KEY or WEATHER_API_KEY == "YOUR_API_KEY_GOES_HERE":
        print("ERROR: WEATHER_API_KEY is not set.")
        return jsonify({"error": "Server configuration error: Weather API key is missing."}), 500

    params = { 'q': city, 'appid': WEATHER_API_KEY, 'units': 'metric', 'cnt': 1 }
    
    try:
        response = requests.get(WEATHER_API_URL, params=params)
        
        if response.status_code != 200:
            print(f"Error from Weather API: {response.status_code} - {response.text}")
            return jsonify({"error": f"Weather API error: {response.json().get('message', 'Unknown error')}"}), response.status_code

        weather_data = response.json()
        
        if 'list' not in weather_data or not weather_data['list']:
            print(f"No forecast data found for city: {city}")
            return jsonify({"error": f"No forecast data found for city: {city}"}), 404
            
        forecast = weather_data['list'][0]

        # --- Extract "Plan B" (API Forecast Data) ---
        rain_mm = forecast.get('rain', {}).get('3h', 0)
        api_pop = forecast.get('pop', 0)
        api_feels_like = forecast['main']['feels_like']
        api_humidity = forecast['main']['humidity']
        api_wind_speed = forecast['wind']['speed']

        # --- Create "Plan A" (Mock ML Prediction) ---
        pop_percentage = int(api_pop * 100)
        if pop_percentage > 50:
            ml_text = f"Yes, it will likely rain. Our model shows a {pop_percentage}% probability."
        elif pop_percentage > 10:
             ml_text = f"A slight chance of rain. Our model shows a {pop_percentage}% probability."
        else:
            ml_text = f"No, it will likely stay dry. Our model shows only a {pop_percentage}% probability."

        # --- Simple Impact/Intensity Analysis ---
        intensity = "No Rain"
        impact = "No Impact"
        if rain_mm > 10: intensity = "Heavy Rain"; impact = "High Impact"
        elif rain_mm > 2.5: intensity = "Moderate Rain"; impact = "Medium Impact"
        elif rain_mm > 0: intensity = "Light Rain"; impact = "Low Impact"

        # --- NEW: Activity Analyzer Logic ---
        recommendation = "No activity selected." # Default text

        if activity == 'run':
            if rain_mm > 0.5:
                recommendation = "Bad for a run. (Risk of rain)"
            elif api_feels_like > 32:
                recommendation = "Challenging for a run. (High heat index)"
            elif api_feels_like < 5:
                recommendation = "Challenging for a run. (Very cold)"
            else:
                recommendation = "It's a great day for a run!"
        
        elif activity == 'hang_laundry':
            if rain_mm > 0:
                recommendation = "Don't hang laundry. (Rain expected)"
            elif api_humidity > 85:
                recommendation = "Not ideal for laundry. (High humidity, slow drying)"
            elif api_wind_speed > 30:
                recommendation = "Risky for laundry. (Very high winds)"
            else:
                recommendation = "Perfect day to hang laundry!"

        elif activity == 'picnic':
            if rain_mm > 0.1:
                recommendation = "Bad day for a picnic. (Rain is likely)"
            elif api_wind_speed > 25:
                recommendation = "Not ideal for a picnic. (Too windy)"
            elif api_feels_like > 35 or api_feels_like < 10:
                recommendation = "Uncomfortable for a picnic. (Temperature is too extreme)"
            else:
                recommendation = "Looks like a great day for a picnic!"

        elif activity == 'bike_commute':
            if rain_mm > 1:
                recommendation = "Bad for biking. (Heavy rain risk)"
            elif api_wind_speed > 35:
                recommendation = "Difficult commute. (Strong head/crosswinds)"
            elif api_pop > 0.5:
                recommendation = "Risky commute. (High chance of rain, bring gear)"
            else:
                recommendation = "Looks clear for your bike commute!"
        
        # --- Save to Database ---
        new_prediction = Prediction(
            city=city,
            live_weather=json.dumps(weather_data),
            ml_prediction_text=ml_text,
            api_forecast_temp=forecast['main']['temp'],
            api_forecast_amount_mm=rain_mm,
            intensity_tag=intensity,
            impact_index=impact,
            api_feels_like=api_feels_like,
            api_humidity=api_humidity,
            api_wind_speed=api_wind_speed,
            api_pop=api_pop,
            # --- NEW ---
            activity_recommendation=recommendation # Save the new text
        )
        
        db.session.add(new_prediction)
        db.session.commit()

        print(f"Successfully processed and saved prediction {new_prediction.id} for {city}")

        return jsonify(new_prediction.to_dict()), 201

    except requests.exceptions.RequestException as e:
        print(f"Network error calling Weather API: {e}")
        return jsonify({"error": f"Network error: Could not connect to weather service."}), 500
    except Exception as e:
        db.session.rollback() 
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500


@app.route('/all', methods=['GET'])
def get_all_predictions():
    try:
        all_predictions = Prediction.query.order_by(Prediction.timestamp.desc()).all()
        predictions_list = [p.to_dict() for p in all_predictions]
        return jsonify(predictions_list), 200
    except Exception as e:
        print(f"Error fetching all predictions: {e}")
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)