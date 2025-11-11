import os
import json
import datetime
import random
import requests
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# --- Configuration ---
# PASTE YOUR API KEY HERE. 
# WARNING: Do not share this file publicly if your key is in it.
WEATHER_API_KEY = "b26abbbb1641a44c12cfa7c7a78c3fd1" 

if WEATHER_API_KEY == "YOUR_API_KEY_GOES_HERE":
    print("="*50)
    print("WARNING: Please replace 'YOUR_API_KEY_GOES_HERE' in app.py")
    print("         with your actual OpenWeatherMap API key.")
    print("="*50)

# --- FIX: Changed http:// to https:// ---
FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast"

# --- App & Database Setup ---
app = Flask(__name__)
CORS(app)  # Allow frontend to call the backend

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///predictions.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Database Model ---
class Prediction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    city = db.Column(db.Text, nullable=False)
    
    # Store the raw JSON response as a string
    live_weather = db.Column(db.Text, nullable=True) 
    
    # "Plan A" - Our complex model's text output
    ml_prediction_text = db.Column(db.Text, nullable=True)
    
    # "Plan B" - Key data points from the API forecast
    api_forecast_temp = db.Column(db.REAL, nullable=True)
    api_forecast_amount_mm = db.Column(db.REAL, nullable=True)
    api_feels_like = db.Column(db.REAL, nullable=True)
    api_humidity = db.Column(db.REAL, nullable=True)
    api_wind_speed = db.Column(db.REAL, nullable=True)
    api_pop = db.Column(db.REAL, nullable=True) # Probability of Precipitation

    # Derived Impact Analysis
    intensity_tag = db.Column(db.Text, nullable=True)
    impact_index = db.Column(db.Text, nullable=True)

    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        # Helper function to convert model to dictionary for JSON response
        return {
            'id': self.id,
            'city': self.city,
            # Safely parse the stored JSON string back into an object
            'live_weather': json.loads(self.live_weather) if self.live_weather else None,
            'ml_prediction_text': self.ml_prediction_text,
            'api_forecast_temp': self.api_forecast_temp,
            'api_forecast_amount_mm': self.api_forecast_amount_mm,
            'api_feels_like': self.api_feels_like,
            'api_humidity': self.api_humidity,
            'api_wind_speed': self.api_wind_speed,
            'api_pop': self.api_pop,
            'intensity_tag': self.intensity_tag,
            'impact_index': self.impact_index,
            'timestamp': self.timestamp.isoformat()
        }

def init_db():
    """Initializes the database and creates tables."""
    with app.app_context():
        db.create_all()
        print("Database initialized and tables created.")

# --- API Routes ---

@app.route('/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint.
    Receives a city, fetches weather, runs models, and stores the result.
    """
    if not WEATHER_API_KEY:
        return jsonify({'error': 'Server is missing API key.'}), 500

    try:
        data = request.json
        city_name = data['location']
        
        # Define the parameters for the API call
        params = {
            'q': city_name,
            'appid': WEATHER_API_KEY,
            'units': 'metric',  # Use 'metric' for Celsius
            'cnt': 1  # We only need the very next forecast (for the next 3 hours)
        }

        print(f"Calling API with params: {params}")
        response = requests.get(FORECAST_API_URL, params=params)
        
        # --- Robust Error Handling ---
        # Check if the API request itself was successful (e.g., 401, 404, 500)
        if response.status_code != 200:
            print(f"Error from Weather API: {response.status_code}")
            print(f"Response body: {response.text}")
            try:
                return jsonify({'error': f"Weather API error: {response.json().get('message', 'Unknown error')}"}), response.status_code
            except requests.exceptions.JSONDecodeError:
                return jsonify({'error': 'Weather API returned a non-JSON error.'}), response.status_code

        forecast_data = response.json()

        # Check if the API returned a valid list (e.g., if city was found)
        if 'list' not in forecast_data or not forecast_data['list']:
            print(f"API did not return forecast data. Response: {forecast_data}")
            return jsonify({'error': 'City not found or no forecast data available.'}), 404
        # --- End of Error Handling ---

        # --- "Plan A" ML Model (Mock) ---
        # This is where you would feed `forecast_data` into your complex ML model
        # For now, we'll generate a mock prediction.
        mock_ml_text = random.choice([
            "Complex model predicts high probability of convective rainfall.",
            "ML analysis indicates stable atmosphere, low precipitation chance.",
            "Our model forecasts significant advection, potential for frontal rain."
        ])

        # --- "Plan B" API Data Extraction ---
        # Extract clear, simple data from the *first* forecast in the list
        first_forecast = forecast_data['list'][0]
        main_data = first_forecast.get('main', {})
        weather_data = first_forecast.get('weather', [{}])[0]
        wind_data = first_forecast.get('wind', {})
        rain_data = first_forecast.get('rain', {})

        api_temp = main_data.get('temp')
        api_feels = main_data.get('feels_like')
        api_humidity = main_data.get('humidity')
        api_wind = wind_data.get('speed')
        # Get probability of precipitation (e.g., 0.8 => 80%)
        api_pop = first_forecast.get('pop', 0) 
        # Get rain volume for the last 3 hours, default to 0
        api_rain_mm = rain_data.get('3h', 0) 

        # --- Impact Analysis ---
        intensity = "No Rain"
        if api_rain_mm > 0:
            if api_rain_mm < 2.5:
                intensity = "Light Rain"
            elif api_rain_mm < 10:
                intensity = "Moderate Rain"
            elif api_rain_mm < 50:
                intensity = "Heavy Rain"
            else:
                intensity = "Violent Rain"

        impact = "Low Impact"
        if intensity != "No Rain" and (api_wind > 10 or api_temp < 5):
            impact = "Medium Impact"
        if intensity in ["Heavy Rain", "Violent Rain"]:
            impact = "High Impact"
        if api_wind > 20:
             impact = "High Impact (Wind)"


        # --- Save to Database ---
        new_prediction = Prediction(
            city=forecast_data.get('city', {}).get('name', city_name),
            live_weather=json.dumps(forecast_data), # Store full JSON as string
            ml_prediction_text=mock_ml_text,
            api_forecast_temp=api_temp,
            api_forecast_amount_mm=api_rain_mm,
            intensity_tag=intensity,
            impact_index=impact,
            api_feels_like=api_feels,
            api_humidity=api_humidity,
            api_wind_speed=api_wind,
            api_pop=api_pop
        )
        
        db.session.add(new_prediction)
        db.session.commit()
        
        print(f"Saved prediction {new_prediction.id} for {new_prediction.city}")

        # --- Return full prediction object to frontend ---
        return jsonify(new_prediction.to_dict()), 200

    except Exception as e:
        db.session.rollback() # Rollback any db changes if an error occurred
        print(f"Error on /predict: {e}")
        # Return a generic server error
        return jsonify({'error': 'An internal server error occurred.'}), 500

@app.route('/all', methods=['GET'])
def get_all_predictions():
    """
    Retrieves all past predictions from the database.
    """
    try:
        all_preds = Prediction.query.order_by(Prediction.timestamp.desc()).all()
        
        # Convert all prediction objects to dictionaries
        return jsonify([pred.to_dict() for pred in all_preds]), 200
        
    except Exception as e:
        print(f"Error on /all: {e}")
        return jsonify({'error': 'Could not retrieve predictions.'}), 500

# --- Main execution ---
if __name__ == '__main__':
    # Create the database and tables if they don't exist
    init_db()
    # Run the Flask app
    app.run(debug=True, port=5000)