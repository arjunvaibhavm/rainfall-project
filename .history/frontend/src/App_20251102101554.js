import React, { useState } from 'react';
import axios from 'axios';

// --- New, more beautiful styles with a CSS Gradient ---
const styles = {
  // The main container, now with a gradient
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Arial, sans-serif',
    padding: '20px',
    minHeight: '100vh',
    // --- THIS IS THE CHANGE ---
    // Removed the backgroundImage, replaced with a CSS gradient
    // This creates a beautiful "sky" effect that needs no internet
    background: 'linear-gradient(180deg, #a6d8ff 0%, #ffffff 70%)',
    // --- END OF CHANGE ---
  },
  // A "glass" container for our app content
  glassContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '420px',
    // Switched to a more solid white for better contrast with the gradient
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(5px)', // The "glass" effect
    border: '1px solid rgba(255, 255, 255, 0.18)',
    marginTop: '20px',
  },
  header: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    // Darker color for better contrast on the light background
    color: '#0056b3', 
    textAlign: 'center',
    textShadow: '0px 1px 3px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    fontSize: '0.9rem',
    color: '#333',
    fontWeight: '600',
  },
  input: {
    padding: '14px',
    fontSize: '1.1rem',
    borderRadius: '10px',
    border: '1px solid #ccc',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', 
  },
  button: {
    padding: '14px',
    fontSize: '1.1rem',
    color: 'white',
    backgroundColor: '#007aff', // Brighter blue
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '20px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  // --- Results styling ---
  resultsContainer: {
    marginTop: '30px',
    width: '100%',
    textAlign: 'center',
  },
  resultBox: {
    backgroundColor: 'rgba(230, 245, 255, 0.7)', // Light blue tint
    padding: '15px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    marginBottom: '15px',
  },
  resultTitle: {
    fontSize: '1rem',
    color: '#0056b3',
    fontWeight: '600',
    marginBottom: '5px',
  },
  resultValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#004a99',
  },
  mlResultValue: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#333',
    marginTop: '5px',
  },
  error: {
    marginTop: '30px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#D8000C',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 220, 220, 0.9)',
    padding: '15px',
    borderRadius: '10px',
  }
};
// --- End of styles ---

function App() {
  const [location, setLocation] = useState('Mumbai');
  const [predictionData, setPredictionData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPredictionData(null);
    setError('');
    setIsLoading(true);

    const dataToSend = { location: location };

    axios.post('http://127.0.0.1:5000/predict', dataToSend)
      .then((response) => {
        console.log("Received response:", response.data);
        setPredictionData(response.data);
      })
      .catch((err) => {
        console.error("Error from API:", err);
        if (err.response && err.response.data && err.response.data.error) {
            setError(err.response.data.error);
        } else {
            setError('Error: Could not get prediction.');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Little helper to change button style while loading
  const loadingButtonStyle = {
    ...styles.button,
    backgroundColor: isLoading ? '#80bfff' : '#007aff',
    cursor: isLoading ? 'not-allowed' : 'pointer',
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassContainer}>
        <h1 style={styles.header}>Rain Predictor</h1>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Enter City Name:</label>
            <input
              type="text"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={styles.input}
              placeholder="e.g., Delhi, Kolkata..."
              required
            />
          </div>
          <button type="submit" style={loadingButtonStyle} disabled={isLoading}>
            {isLoading ? 'Predicting...' : "Get Forecast"}
          </button>
        </form>

        {/* --- Display Area --- */}
        <div style={styles.resultsContainer}>
          {isLoading && <h2 style={{...styles.resultTitle, fontSize: '1.2rem'}}>Loading...</h2>}

          {!isLoading && error && (
            <div style={styles.error}>{error}</div>
          )}

          {!isLoading && predictionData && (
            <div>
              <div style={auto(styles.resultBox)}>
                <div style={styles.resultTitle}>🌡️ Forecasted Temp (in ~3h)</div>
                <div style={styles.resultValue}>
                  {predictionData.api_forecast_temp.toFixed(1)}°C
                </div>
              </div>
              
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>💧 Forecasted Rain (in ~3h)</div>
                <div style={styles.resultValue}>
                  {predictionData.api_forecast_amount_mm.toFixed(2)} mm
                </div>
              </div>

              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>🤖 Our ML Model's Prediction</div>
                <div style={styles.mlResultValue}>
                  {predictionData.ml_prediction_text}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

