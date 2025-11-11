import React, { useState } from 'react';
import axios from 'axios';

// --- Styles for Desktop Dark Theme ---
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Arial, sans-serif',
    padding: '20px',
    minHeight: '100vh',
    backgroundColor: '#1a202c', // Dark Charcoal background
  },
  glassContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '600px', // Wider for "desktop"
    backgroundColor: 'rgba(45, 55, 72, 0.8)', // Dark Glass
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    marginTop: '20px',
  },
  header: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#ffffff', // White text
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
    color: '#cbd5e0', // Light gray text
    fontWeight: '600',
  },
  input: {
    padding: '14px',
    fontSize: '1.1rem',
    borderRadius: '10px',
    border: '1px solid #4a5568', // Darker border
    backgroundColor: 'rgba(26, 32, 44, 0.7)', // Dark input bg
    color: '#ffffff', // White text
  },
  button: {
    padding: '14px',
    fontSize: '1.1rem',
    color: 'white',
    backgroundColor: '#3182ce', // Blue
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
    textAlign: 'center',
  },
  // --- NEW: Grid for sideways layout ---
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // Two equal columns
    gap: '15px',
    width: '100%',
  },
  // --- NEW: Full-width item for the grid ---
  fullWidthItem: {
    gridColumn: '1 / -1', // Spans both columns
  },
  resultBox: {
    backgroundColor: 'rgba(26, 32, 44, 0.8)', // Darker box
    padding: '20px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '15px',
    border: '1px solid rgba(255, 255, 255, 0.1)', // Default subtle border
    transition: 'all 0.3s ease', // Smooth transition
  },
  resultTitle: {
    fontSize: '1rem',
    color: '#a0aec0', // Lighter gray
    fontWeight: '600',
    marginBottom: '8px',
  },
  resultValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#ffffff', // White text
  },
  // --- Simplified styles ---
  mlResultValue: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#38b2ac', // Teal
    marginTop: '5px',
  },
  impactResultValue: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#ffffff', // White
    marginTop: '5px',
  },
  error: {
    marginTop: '30px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#f56565', // Red
    textAlign: 'center',
    backgroundColor: 'rgba(254, 235, 235, 0.1)',
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
    backgroundColor: isLoading ? '#4a5568' : '#3182ce',
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
          {isLoading && <h2 style={{...styles.resultTitle, fontSize: '1.2rem', color: 'white'}}>Loading...</h2>}

          {!isLoading && error && (
            <div style={styles.error}>{error}</div>
          )}

          {/* This will show the new simplified grid when data is available */}
          {!isLoading && predictionData && (
            <div style={styles.gridContainer}>

              {/* Box 1: Intensity (Full Width) */}
              <div style={{...styles.resultBox, ...styles.fullWidthItem}}>
                <div style={styles.resultTitle}>🚦 INTENSITY </div>
                <div style={styles.resultValue}>
                  {predictionData.intensity_tag}
                </div>
              </div>
              
              {/* Box 2: Impact (Full Width) */}
              <div style={{...styles.resultBox, ...styles.fullWidthItem}}>
                <div style={styles.resultTitle}>⚠️ IMPACT INDEX</div>
                <div style={styles.impactResultValue}>
                  {predictionData.impact_index}
                </div>
              </div>

              {/* --- 
                Box 3: ML Confidence (Full Width) - HIGHLIGHTED 
              --- */}
              <div style={{
                  ...styles.resultBox, 
                  ...styles.fullWidthItem,
                  border: '2px solid #38b2ac', // <-- HIGHLIGHT BORDER
                  boxShadow: '0 4px 20px 0 rgba(56, 178, 172, 0.15)' // <-- HIGHLIGHT GLOW
                }}>
                <div style={styles.resultTitle}>🤖 ML CONFIDENCE SCORE (Your Model)</div>
                <div style={styles.mlResultValue}>
                  {predictionData.ml_prediction_text}
                </div>
              </div>
              {/* --- End of Highlighted Box --- */}


              {/* Box 4: Rain Amount (Half Width) */}
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>💧 FORECASTED RAIN</div>
                <div style={{...styles.resultValue, fontSize: '2rem'}}>
                  {predictionData.api_forecast_amount_mm.toFixed(2)} mm
                </div>
              </div>

              {/* Box 5: Temperature (Half Width) */}
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>🌡️ FORECASTED TEMP</div>
                <div style={{...styles.resultValue, fontSize: '2rem'}}>
                  {predictionData.api_forecast_temp.toFixed(1)}°C
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