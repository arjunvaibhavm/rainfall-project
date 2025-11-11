
WEATHER_API_KEY = "b26abbbb1641a44c12cfa7c7a78c3fd1"  # <-- IMPORTANT: PASTE YOUR KEY HERE
FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        city_name = data['location']
        print(f"Received request for city: {city_name}")

        params = {
            'q': city_name,
            'appid': WEATHER_API_KEY,
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
        
        # --- NEW: Extracting all the new features ---
        api_forecast_temp = main_data['temp']
        api_feels_like = main_data['feels_like']
        api_humidity = main_data['humidity']
        api_wind_speed = wind_data['speed']
        api_pop = forecast.get('pop', 0) * 100 # Probability of Precipitation
        
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
        
        intensity, impact = classify_rainfall(api_forecast_amount_mm)
        
        # --- NEW: Build the final data package ---
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
        
        save_prediction(prediction_data)
        
        return jsonify(prediction_data)

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()  
    app.run(port=5000, debug=True)

