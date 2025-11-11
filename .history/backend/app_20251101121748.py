import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

# 1. Initialize the Flask app
app = Flask(__name__)
# 2. Add CORS to the app
CORS(app)

# 3. Load our model and scaler
print("Loading model and scaler...")
model = joblib.load('rainfall_model.pkl')
scaler = joblib.load('scaler.pkl')
print("Model and scaler loaded successfully.")

# This is the order of features our model was trained on:
# ['MinTemp', 'MaxTemp', 'Humidity9am', 'Humidity3pm', 
# 'Pressure9am', 'Pressure3pm', 'WindSpeed9am', 'WindSpeed3pm', 'RainToday_Num']


# 4. Define our prediction endpoint
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get data from the POST request
        data = request.json
        print(f"Received data: {data}")

        # --- Prepare the data for the model ---
        
        # 1. Get the values from the JSON data
        min_temp = data['MinTemp']
        max_temp = data['MaxTemp']
        humidity_9am = data['Humidity9am']
        humidity_3pm = data['Humidity3pm']
        pressure_9am = data['Pressure9am']
        pressure_3pm = data['Pressure3pm']
        wind_speed_9am = data['WindSpeed9am']
        wind_speed_3pm = data['WindSpeed3pm']
        
        # Convert 'RainToday' (Yes/No) to (1/0)
        rain_today_num = 1 if data['RainToday'] == 'Yes' else 0
        
        # 2. Create the feature list in the *exact* order
        features = [
            min_temp, max_temp, humidity_9am, humidity_3pm,
            pressure_9am, pressure_3pm, wind_speed_9am, wind_speed_3pm,
            rain_today_num
        ]
        
        # 3. Convert to a 2D numpy array (which the model expects)
        final_features = np.array(features).reshape(1, -1)
        
        # 4. Scale the features using our saved scaler
        scaled_features = scaler.transform(final_features)
        
        # --- Make the prediction ---
        prediction = model.predict(scaled_features)
        
        # 5. Get the prediction probability (optional, but cool)
        # This tells us *how confident* the model is
        probability = model.predict_proba(scaled_features)[0][prediction[0]]
        
        # 6. Format the response
        if prediction[0] == 1:
            result = f"Yes, it will likely rain. (Confidence: {probability*100:.2f}%)"
        else:
            result = f"No, it will likely not rain. (Confidence: {probability*100:.2f}%)"
            
        print(f"Prediction: {result}")
        # Send the result back as JSON
        return jsonify({'prediction_text': result})

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

# 5. Run the app
if __name__ == '__main__':
    # 'debug=True' means the server will auto-reload when you save the file
    app.run(port=5000, debug=True)