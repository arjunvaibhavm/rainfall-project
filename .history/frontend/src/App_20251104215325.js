import React, { useState } from 'react';
import axios from 'axios';

// --- Styles with a "Desktop Dark" Theme ---
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Arial, sans-serif',
    padding: '20px',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #333 0%, #1a1a1a 70%)',
  },
  glassContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    // --- NEW: Wider container for the grid ---
    maxWidth: '700px', 
    backgroundColor: 'rgba(40, 40, 40, 0.75)', 
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(8px)', 
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginTop: '20px',
  },
  header: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#00c7b0', 
    textAlign: 'center',
    textShadow: '0px 1px 3px rgba(0,0,0,0.3)',
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
    color: '#f0f0f0',
    fontWeight: '600',
  },
  input: {
    padding: '14px',
    fontSize: '1.1rem',
    borderRadius: '10px',
    border: '1px solid #555',
    backgroundColor: 'rgba(10, 10, 10, 0.5)', 
    color: '#ffffff', 
  },
  button: {
    padding: '14px',
    fontSize: '1.1rem',
    color: 'white',
    backgroundColor: '#00c7b0', 
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '20px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  resultsContainer: {
    marginTop: '30px',
    width: '100%',
  },
  // --- NEW: Grid layout for "sideways" content ---
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // Two equal columns
    gap: '15px', // Space between boxes
  },
  // --- NEW: Style for a box that spans both columns ---
  resultBoxFull: {
    gridColumn: '1 / -1', // Make this box span the full width
    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    padding: '15px',
    borderRadius: '15px',
    marginBottom: '15px',
    textAlign: 'center',
  },
  resultBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    padding: '15px',
    borderRadius: '15px',
    textAlign: 'center',
  },
  resultTitle: {
    fontSize: '1rem',
    color: '#00c7b0',
    fontWeight: '600',
    marginBottom: '5px',
  },
  resultValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#f0f0f0',
  },
  mlResultValue: {
    fontSize: '1.1rem', // Adjusted size for grid
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginTop: '5px',
  },
  impactResultValue: {
    fontSize: '1.1rem', // Adjusted size for grid
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginTop: '5px',
  },
  error: {
    marginTop: '30px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#ffc0cb', 
    textAlign: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.6)',
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

  const loadingButtonStyle = {
    ...styles.button,
    backgroundColor: isLoading ? '#007a6e' : '#00c7b0',
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

        {/* --- UPDATED: Display Area --- */}
        <div style={styles.resultsContainer}>
          {isLoading && <h2 style={{...styles.resultTitle, color: '#f0f0f0', fontSize: '1.2rem'}}>Loading...</h2>}

          {!isLoading && error && (
            <div style={styles.error}>{error}</div>
          )}

          {/* --- NEW: Using the grid layout --- */}
          {!isLoading && predictionData && (
            <div style={styles.resultsGrid}>
              
              {/* --- Row 1 (Spans both columns) --- */}
              <div style={styles.resultBoxFull}>
                <div style={styles.resultTitle}>🚦 INTENSITY (in ~3h)</div>
                <div style={styles.resultValue}>
                  {predictionData.intensity_tag}
                </div>
              </div>

              {/* --- Row 2 (Spans both columns) --- */}
              <div style={styles.resultBoxFull}>
                <div style={styles.resultTitle}>⚠️ IMPACT INDEX</div>
                <div style={styles.impactResultValue}>
                  {predictionData.impact_index}
                </div>
              </div>
              
              {/* --- Row 3 (Spans both columns) --- */}
              <div style={styles.resultBoxFull}>
                <div style={styles.resultTitle}>🤖 ML CONFIDENCE SCORE</div>
                <div style={{...styles.mlResultValue, color: '#00c7b0'}}>
                  {predictionData.ml_prediction_text}
                </div>
              </div>

              {/* --- Row 4 (Two columns) --- */}
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>💧 API RAIN (in ~3h)</div>
                <div style={{...styles.resultValue, fontSize: '1.8rem'}}>
                  {predictionData.api_forecast_amount_mm.toFixed(2)} mm
                </div>
              </div>
              
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>📈 API PRECIP. CHANCE</div>
                <div style={{...styles.resultValue, fontSize: '1.8rem'}}>
                  {predictionData.api_pop.toFixed(0)}%
                </div>
              </div>

              {/* --- Row 5 (Two columns) --- */}
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>🌡️ FORECASTED TEMP</div>
                <div style={{...styles.resultValue, fontSize: '1.8rem'}}>
                  {predictionData.api_forecast_temp.toFixed(1)}°C
                </div>
              </div>

              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>🌡️ FEELS LIKE</div>
                <div style={{...styles.resultValue, fontSize: '1.8rem'}}>
                  {predictionData.api_feels_like.toFixed(1)}°C
                </div>
              </div>

              {/* --- Row 6 (Two columns) --- */}
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>💨 WIND SPEED</div>
                <div style={{...styles.resultValue, fontSize: '1.8rem'}}>
                  {predictionData.api_wind_speed.toFixed(1)} m/s
                </div>
              </div>

              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>💧 HUMIDITY</div>
                <div style={{...styles.resultValue, fontSize: '1.8rem'}}>
                  {predictionData.api_humidity.toFixed(0)}%
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

