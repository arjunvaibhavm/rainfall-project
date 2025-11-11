import os
import json
import datetime
import random
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import requests

# --- Configuration ---
# PASTE YOUR API KEY HERE.
# WARNING: Do not share this file publicly if your key is in it.
WEATHER_API_KEY = "b26abbbb1641a44c12cfa7c7a78c3fd1"

if WEATHER_API_KEY == "b26abbbb1641a44c12cfa7c7a78c3fd1 ":
    print("="*50)
    print("WARNING: Please replace 'YOUR_API_KEY_GOES_HERE' in app.py")
    print("         with your actual OpenWeatherMap API key.")
    print("="*50)

# --- FIX: Changed http:// to https:// ---
WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/forecast"

# --- App & Database Setup ---
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for our React app

# Configure database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'predictions.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Database Model ---
class Prediction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    city = db.Column(db.Text, nullable=False)
    live_weather = db.Column(db.Text, nullable=False) # Stores the full JSON response as a string
    
    # "Plan A" - Our own ML model's prediction
    ml_prediction_text = db.Column(db.Text, nullable=True)
    
    # "Plan B" - Key data points from the API forecast
    api_forecast_temp = db.Column(db.REAL, nullable=True)
    api_forecast_amount_mm = db.Column(db.REAL, nullable=True)
    intensity_tag = db.Column(db.Text, nullable=True)
    impact_index = db.Column(db.Text, nullable=True)
    
    # Extra useful context
    api_feels_like = db.Column(db.REAL, nullable=True)
    api_humidity = db.Column(db.REAL, nullable=True)
    api_wind_speed = db.Column(db.REAL, nullable=True)
    api_pop = db.Column(db.REAL, nullable=True) # Probability of Precipitation
    
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        # Safely parse the live_weather JSON string back into an object
        live_weather_data = {}
        try:
            live_weather_data = json.loads(self.live_weather)
        except json.JSONDecodeError:
            print(f"Error decoding JSON for prediction ID {self.id}")
            live_weather_data = {"error": "Could not parse stored weather data."}

        return {
            "id": self.id,
            "city": self.city,
            "live_weather": live_weather_data, # Send as a JSON object
            "ml_prediction_text": self.ml_prediction_text,
            "api_forecast_temp": self.api_forecast_temp,
            "api_forecast_amount_mm": self.api_forecast_amount_mm,
            "intensity_tag": self.intensity_tag,
            "impact_index": self.impact_index,
            "api_feels_like": self.api_feels_like,
            "api_humidity": self.api_humidity,
            "api_wind_speed": self.api_wind_speed,
            "api_pop": self.api_pop,
            "timestamp": self.timestamp.isoformat()
        }

# --- API Routes ---

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'city' not in data:
        return jsonify({"error": "City is required"}), 400

    city = data['city']

    # --- Step 1: Call OpenWeatherMap API ---
    # We add 'cnt: 1' to only get the *next* forecast (3 hours from now)
    # We add 'units: metric' to get Celsius and mm
    params = {
        'q': city,
        'appid': WEATHER_API_KEY,
        'units': 'metric',
        'cnt': 1 
    }
    
    try:
        response = requests.get(WEATHER_API_URL, params=params)
        
        # --- Handle API Errors ---
        if response.status_code != 200:
            print(f"Error from Weather API: {response.status_code} - {response.text}")
            return jsonify({"error": f"Weather API error: {response.json().get('message', 'Unknown error')}"}), response.status_code

        weather_data = response.json()
        
        # Handle "city not found" or empty response
        if 'list' not in weather_data or not weather_data['list']:
            print(f"No forecast data found for city: {city}")
            return jsonify({"error": f"No forecast data found for city: {city}"}), 404
            
        forecast = weather_data['list'][0]

        # --- Step 2: Extract "Plan B" (API Forecast Data) ---
        
        # Get rain amount. 'rain' key might not exist if no rain.
        # .get('3h', 0) safely gets the 3-hour rain amount, defaulting to 0
        rain_mm = forecast.get('rain', {}).get('3h', 0)

        # Get probability of precipitation (pop)
        # This is a value from 0 to 1.
        api_pop = forecast.get('pop', 0)

        # --- Step 3: Create "Plan A" (Mock ML Prediction) ---
        # We'll base our mock prediction on the API's 'pop' value
        
        pop_percentage = int(api_pop * 100) # Convert 0.75 to 75
        
        if pop_percentage > 50:
            ml_text = f"Yes, it will likely rain. Our model shows a {pop_percentage}% probability."
        elif pop_percentage > 10:
             ml_text = f"A slight chance of rain. Our model shows a {pop_percentage}% probability."
        else:
            ml_text = f"No, it will likely stay dry. Our model shows only a {pop_percentage}% probability."

        # --- Step 4: Simple Impact/Intensity Analysis ---
        intensity = "No Rain"
        impact = "No Impact"
        if rain_mm > 10:
            intensity = "Heavy Rain"
            impact = "High Impact"
        elif rain_mm > 2.5:
            intensity = "Moderate Rain"
            impact = "Medium Impact"
        elif rain_mm > 0:
            intensity = "Light Rain"
            impact = "Low Impact"

        # --- Step 5: Save to Database ---
        new_prediction = Prediction(
            city=city,
            live_weather=json.dumps(weather_data), # Store full JSON as string
            ml_prediction_text=ml_text,
            api_forecast_temp=forecast['main']['temp'],
            api_forecast_amount_mm=rain_mm,
            intensity_tag=intensity,
            impact_index=impact,
            api_feels_like=forecast['main']['feels_like'],
            api_humidity=forecast['main']['humidity'],
            api_wind_speed=forecast['wind']['speed'],
            api_pop=api_pop
        )
        
        db.session.add(new_prediction)
        db.session.commit()

        print(f"Successfully processed and saved prediction {new_prediction.id} for {city}")

        # --- Step 6: Return new prediction to frontend ---
        return jsonify(new_prediction.to_dict()), 201

    except requests.exceptions.RequestException as e:
        print(f"Network error calling Weather API: {e}")
        return jsonify({"error": f"Network error: Could not connect to weather service."}), 500
    except Exception as e:
        db.session.rollback() # Rollback any partial DB changes
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500


@app.route('/all', methods=['GET'])
def get_all_predictions():
    try:
        # Get all predictions, most recent first
        all_predictions = Prediction.query.order_by(Prediction.timestamp.desc()).all()
        
        # Convert them all to dictionaries
        predictions_list = [p.to_dict() for p in all_predictions]
        
        return jsonify(predictions_list), 200
        
    except Exception as e:
        print(f"Error fetching all predictions: {e}")
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500


# --- Main execution ---
if __name__ == '__main__':
    # Create the database and tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Run the app
    # host='0.0.0.0' makes it accessible on your local network
    # debug=True automatically reloads the server when you save the file
    app.run(host='0.0.0.0', port=5000, debug=True)