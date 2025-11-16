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

WEATHER_API_URL = "[https://api.openweathermap.org/data/2.5/forecast](https://api.openweathermap.org/data/2.5/forecast)"

# --- App & Database Setup ---
app = Flask(__name__)
CORS(app) 

# --- DATABASE CONFIGURATION ---
prod_db_url = os.environ.get('DATABASE_URL')
if prod_db_url:
    # We are in production (on Render)
    # Render's PostgreSQL URLs start with 'postgres://' but SQLAlchemy needs 'postgresql://'
    if prod_db_url.startswith("postgres://"):
        prod_db_url = prod_db_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = prod_db_url
    print("Connecting to production PostgreSQL database...")
else:
    # We are running locally
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
    # --- NEW: Added for Activity Feature ---
    activity_recommendation = db.Column(db.Text, nullable=True)

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
            "timestamp": self.timestamp.isoformat(),
            "activity_recommendation": self.activity_recommendation 
        }

# --- Helper Function for Location Scoring ---

def get_recommendation_for_block(activity, forecast_block):
    """
    Analyzes a single 3-hour forecast block and returns a recommendation.
    Returns a tuple: (recommendation_string, score)
    Score: 2 for "Good", 1 for "OK/Challenging", 0 for "Bad".
    """
    try:
        block_rain_mm = forecast_block.get('rain', {}).get('3h', 0)
        block_feels_like = forecast_block['main']['feels_like']
        block_humidity = forecast_block['main']['humidity']
        block_wind = forecast_block['wind']['speed']
        block_pop = forecast_block.get('pop', 0)

        if activity == 'run':
            if block_rain_mm > 0.5: return ("Bad for a run (Rain)", 0)
            if block_feels_like > 32: return ("Challenging (Heat)", 1)
            if block_feels_like < 5: return ("Challenging (Cold)", 1)
            return ("It's a great day for a run!", 2)
        
        elif activity == 'hang_laundry':
            if block_rain_mm > 0: return ("Don't hang laundry (Rain)", 0)
            if block_humidity > 85: return ("Not ideal (High humidity)", 1)
            if block_wind > 30: return ("Risky (High winds)", 1)
            return ("Perfect day to hang laundry!", 2)

        elif activity == 'picnic':
            if block_rain_mm > 0.1: return ("Bad for a picnic (Rain)", 0)
            if block_wind > 25: return ("Not ideal (Too windy)", 1)
            if block_feels_like > 35 or block_feels_like < 10: return ("Uncomfortable (Temp)", 1)
            return ("Looks like a great day!", 2)

        elif activity == 'bike_commute':
            if block_rain_mm > 1: return ("Bad for biking (Heavy rain)", 0)
            if block_wind > 35: return ("Difficult (Strong winds)", 1)
            if block_pop > 0.5: return ("Risky (High chance of rain)", 1)
            return ("Looks clear for your commute!", 2)
        
        return ("No activity selected.", 0)

    except Exception as e:
        print(f"Error in get_recommendation_for_block: {e}")
        return (f"Error analyzing", 0)


def get_weather_for_city(city_name):
    """
    Fetches 3-hour (1 block) forecast for a single city.
    Returns the JSON data or None if an error occurs.
    """
    params = {
        'q': city_name,
        'appid': WEATHER_API_KEY,
        'units': 'metric',
        'cnt': 1 # --- CHANGED: Back to 1 block ---
    }
    try:
        response = requests.get(WEATHER_API_URL, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Weather API error for {city_name}: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Network error for {city_name}: {e}")
        return None

# --- API Routes ---

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'city' not in data:
        return jsonify({"error": "Anchor city is required"}), 400

    anchor_city = data['city']
    activity = data.get('activity', 'none')
    compare_locations_str = data.get('compare_locations', '')
    
    # Create list of cities to compare
    compare_cities = [city.strip() for city in compare_locations_str.split(',') if city.strip()]
    # Add anchor city to the list, and remove duplicates
    all_cities_to_check = [anchor_city] + [city for city in compare_cities if city.lower() != anchor_city.lower()]

    if not WEATHER_API_KEY or WEATHER_API_KEY == "YOUR_API_KEY_GOES_HERE":
        return jsonify({"error": "Server configuration error: Weather API key is missing."}), 500

    # --- Location Scouting Logic ---
    location_ranking = []
    anchor_city_weather_data = None
    
    for city in all_cities_to_check:
        weather_data = get_weather_for_city(city)
        
        if not weather_data or 'list' not in weather_data or not weather_data['list']:
            location_ranking.append({
                "city": city,
                "score": 0,
                "recommendation": "No data found",
                "status": "No data found"
            })
            continue

        # Save the anchor city's data for our main display
        if city.lower() == anchor_city.lower():
            anchor_city_weather_data = weather_data

        # Score this location based on its *only* forecast block
        forecast_block = weather_data['list'][0]
        recommendation, score = get_recommendation_for_block(activity, forecast_block)

        location_ranking.append({
            "city": city,
            "score": score,
            "recommendation": recommendation,
            "status": "Analyzed"
        })

    # Sort the ranking: best score first
    location_ranking.sort(key=lambda x: x['score'], reverse=True)

    # --- Now, process the ANCHOR CITY data for display and DB saving ---
    if not anchor_city_weather_data:
        # This handles if the anchor city itself had no data
        return jsonify({"error": f"Could not retrieve weather data for anchor city: {anchor_city}"}), 404

    # Get data from the *first* (and only) forecast block
    first_forecast = anchor_city_weather_data['list'][0]
    rain_mm = first_forecast.get('rain', {}).get('3h', 0)
    api_pop = first_forecast.get('pop', 0)
    api_feels_like = first_forecast['main']['feels_like']
    api_humidity = first_forecast['main']['humidity']
    api_wind_speed = first_forecast['wind']['speed']

    # "Plan A" (Mock ML)
    pop_percentage = int(api_pop * 100)
    if pop_percentage > 50: ml_text = f"Yes, it will likely rain. Our model shows a {pop_percentage}% probability."
    elif pop_percentage > 10: ml_text = f"A slight chance of rain. Our model shows a {pop_percentage}% probability."
    else: ml_text = f"No, it will likely stay dry. Our model shows only a {pop_percentage}% probability."

    # "Plan B" (Impact)
    intensity = "No Rain"; impact = "No Impact"
    if rain_mm > 10: intensity = "Heavy Rain"; impact = "High Impact"
    elif rain_mm > 2.5: intensity = "Moderate Rain"; impact = "Medium Impact"
    elif rain_mm > 0: intensity = "Light Rain"; impact = "Low Impact"

    # Get first-block recommendation for *anchor city*
    first_block_recommendation, _ = get_recommendation_for_block(activity, first_forecast)

    # --- Save to Database (Only the *anchor city's* first forecast) ---
    try:
        new_prediction = Prediction(
            city=anchor_city,
            live_weather=json.dumps(anchor_city_weather_data), # Store full JSON
            ml_prediction_text=ml_text,
            api_forecast_temp=first_forecast['main']['temp'],
            api_forecast_amount_mm=rain_mm,
            intensity_tag=intensity,
            impact_index=impact,
            api_feels_like=api_feels_like,
            api_humidity=api_humidity,
            api_wind_speed=api_wind_speed,
            api_pop=api_pop,
            activity_recommendation=first_block_recommendation
        )
        db.session.add(new_prediction)
        db.session.commit()
        print(f"Successfully processed and saved prediction {new_prediction.id} for {anchor_city}")

        # --- Step 6: Return new prediction to frontend ---
        final_response_data = new_prediction.to_dict()
        final_response_data['location_ranking'] = location_ranking # <-- NEW: Add ranking
        
        return jsonify(final_response_data), 201

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


# --- Main execution ---
if __name__ == '__main__':
    # Create the database and tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)
