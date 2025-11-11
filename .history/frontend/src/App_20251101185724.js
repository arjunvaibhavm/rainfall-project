import React, { useState } from 'react';
import axios from 'axios';

// --- Styles (CSS-in-JS) ---
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    backgroundColor: '#f4f7f6',
    minHeight: '100vh',
  },
  header: {
    fontSize: '2.5rem',
    color: '#333',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    marginTop: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '5px',
    fontSize: '0.9rem',
    color: '#555',
  },
  input: {
    padding: '12px',
    fontSize: '1.1rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  button: {
    padding: '12px',
    fontSize: '1.1rem',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px',
    fontWeight: 'bold',
  },
  // --- NEW: Results area styling ---
  resultsContainer: {
    marginTop: '30px',
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    padding: '20px',
  },
  resultBox: {
    textAlign: 'center',
  },
  resultTitle: {
    fontSize: '1.1rem',
    color: '#555',
    marginBottom: '5px',
  },
  resultValue: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#007bff',
  },
  mlResultValue: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#333',
    marginTop: '15px',
  },
  error: {
    marginTop: '30px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#D8000C',
    textAlign: 'center',
  }
};
// --- End of styles ---

function App() {
  // 1. State for the location
  const [location, setLocation] = useState('Mumbai');
  
  // --- NEW: State for all our new data ---
  const [predictionData, setPredictionData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 3. Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setPredictionData(null); // Clear old results
    setError('');
    setIsLoading(true);

    const dataToSend = {
      location: location
    };

    // Make sure the URL matches your Flask server
    axios.post('http://127.0.0.1:5000/predict', dataToSend)
      .then((response) => {
        // --- NEW: Store the entire response object ---
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

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🌦️ Indian Rainfall Predictor</h1>
      
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
        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? 'Predicting...' : "Get Forecast"}
        </button>
      </form>

      {/* --- NEW: Display Area --- */}

      {isLoading && <h2 style={styles.error}>Loading...</h2>}

      {!isLoading && error && (
        <h2 style={styles.error}>{error}</h2>
      )}

      {/* If we have data, show all of it */}
      {!isLoading && predictionData && (
        <div style={styles.resultsContainer}>
          
          <div style={styles.resultBox}>
            <div style={styles.resultTitle}>Forecasted Temp (in ~3h)</div>
            <div style={styles.resultValue}>
              {/* Use .toFixed(1) to show one decimal place */}
              {predictionData.api_forecast_temp.toFixed(1)}°C
            </div>
          </div>
          
          <div style={styles.resultBox} style={{marginTop: '20px'}}>
            <div style={styles.resultTitle}>Forecasted Rain (in ~3h)</div>
            <div style={styles.resultValue}>
              {/* Use .toFixed(2) to show two decimal places */}
              {predictionData.api_forecast_amount_mm.toFixed(2)} mm
            </div>
          </div>

          <div style={styles.resultBox} style={{marginTop: '20px'}}>
            <div style={styles.resultTitle}>Our ML Model's Prediction</div>
            <div style={styles.mlResultValue}>
              {predictionData.ml_prediction_text}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}

export default App;

