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
    backgroundColor: '#1a202c', 
    width: '100%',
    boxSizing: 'border-box',
  },
  glassContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '1024px', // <-- RESTORED & WIDENED (was 600px)
    backgroundColor: 'rgba(45, 55, 72, 0.8)', 
    padding: '30px',
    borderRadius: '20px', // <-- RESTORED
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', // <-- RESTORED
    backdropFilter: 'blur(5px)', // <-- RESTORED
    border: '1px solid rgba(255, 255, 255, 0.18)', // <-- RESTORED
    marginTop: '20px', // <-- RESTORED
    boxSizing: 'border-box',
  },
  header: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#ffffff', 
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
    marginBottom: '20px', 
  },
  label: {
    marginBottom: '8px',
    fontSize: '0.9rem',
    color: '#cbd5e0', 
    fontWeight: '600',
  },
  input: {
    padding: '14px',
    fontSize: '1.1rem',
    borderRadius: '10px',
    border: '1px solid #4a5568', 
    backgroundColor: 'rgba(26, 32, 44, 0.7)', 
    color: '#ffffff', 
    boxSizing: 'border-box',
  },
  select: {
    padding: '14px',
    fontSize: '1.1rem',
    borderRadius: '10px',
    border: '1px solid #4a5568',
    backgroundColor: 'rgba(26, 32, 44, 0.7)',
    color: '#ffffff',
    boxSizing: 'border-box',
  },
  button: {
    padding: '14px',
    fontSize: '1.1rem',
    color: 'white',
    backgroundColor: '#3182ce', 
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
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', 
    gap: '15px',
    width: '100%',
  },
  fullWidthItem: {
    gridColumn: '1 / -1', 
  },
  resultBox: {
    backgroundColor: 'rgba(26, 32, 44, 0.8)', 
    padding: '20px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '15px',
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    transition: 'all 0.3s ease', 
    boxSizing: 'border-box',
  },
  resultTitle: {
    fontSize: '1rem',
    color: '#a0aec0', 
    fontWeight: '600',
    marginBottom: '8px',
  },
  resultValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#ffffff', 
  },
  mlResultValue: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#38b2ac', 
    marginTop: '5px',
  },
  impactResultValue: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#ffffff', 
    marginTop: '5px',
  },
  recommendationValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#f6e05e', // A highlight yellow
    marginTop: '5px',
  },
  error: {
    marginTop: '30px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#f56565', 
    textAlign: 'center',
    backgroundColor: 'rgba(254, 235, 235, 0.1)',
    padding: '15px',
    borderRadius: '10px',
  },
  // --- NEW: Styles for the Hourly Planner ---
  hourlyContainer: {
    gridColumn: '1 / -1', // Make it span the full width of the grid
    backgroundColor: 'rgba(26, 32, 44, 0.8)',
    padding: '20px',
    borderRadius: '15px',
    marginTop: '15px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  hourlyTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
    marginBottom: '15px',
    borderBottom: '1px solid #4a5568',
    paddingBottom: '10px',
  },
  hourlyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #4a5568',
  },
  hourlyTime: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: 'white',
  },
  hourlyRecommendation: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#cbd5e0', // Light gray
  },
  // --- End of new styles ---
};
// --- End of styles ---

function App() {
  const [location, setLocation] = useState('Mumbai');
  const [predictionData, setPredictionData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activity, setActivity] = useState('run'); 

  // --- IMPORTANT ---
  // When you deploy, you MUST change this URL to your live backend URL
  const API_URL = 'http://127.0.0.1:5000/predict'; 

  const handleSubmit = (e) => {
    e.preventDefault();
    setPredictionData(null);
    setError('');
    setIsLoading(true);

    const dataToSend = { 
      city: location,
      activity: activity 
    };

    axios.post(API_URL, dataToSend)
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

          <div style={styles.formGroup}>
            <label style={styles.label}>Select Activity:</label>
            <select
              style={styles.select}
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            >
              <option value="run">Go for a run</option>
              <option value="hang_laundry">Hang laundry outside</option>
              <option value="picnic">Plan a picnic</option>
              <option value="bike_commute">Commute by bike</option>
            </select>
          </div>

          <button type="submit" style={loadingButtonStyle} disabled={isLoading}>
            {isLoading ? 'Predicting...' : "Get Forecast & Advice"}
          </button>
        </form>

        <div style={styles.resultsContainer}>
          {isLoading && <h2 style={{...styles.resultTitle, fontSize: '1.2rem', color: 'white'}}>Loading...</h2>}

          {!isLoading && error && (
            <div style={styles.error}>{error}</div>
          )}

          {!isLoading && predictionData && (
            <div style={styles.gridContainer}>

              {/* --- Recommendation Box (Top & Highlighted) --- */}
              <div style={{
                  ...styles.resultBox, 
                  ...styles.fullWidthItem,
                  border: '2px solid #f6e05e', 
                  boxShadow: '0 4px 20px 0 rgba(246, 224, 94, 0.15)' 
                }}>
                <div style={styles.resultTitle}>💡 YOUR ACTIVITY ADVICE</div>
                <div style={styles.recommendationValue}>
                  {predictionData.activity_recommendation}
                </div>
              </div>

              {/* --- CHANGED: Box 1: Intensity (Half Width) --- */}
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>🚦 INTENSITY </div>
                <div style={styles.resultValue}>
                  {predictionData.intensity_tag}
                </div>
              </div>
              
              {/* --- CHANGED: Box 2: Impact (Half Width) --- */}
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>⚠️ IMPACT INDEX</div>
                <div style={styles.impactResultValue}>
                  {predictionData.impact_index}
                </div>
              </div>

              {/* Box 3: ML Confidence (Full Width) */}
              <div style={{
                  ...styles.resultBox, 
                  ...styles.fullWidthItem,
                  border: '2px solid #38b2ac', 
                  boxShadow: '0 4px 20px 0 rgba(56, 178, 172, 0.15)' 
                }}>
                <div style={styles.resultTitle}>🤖 ML CONFIDENCE SCORE (Your Model)</div>
                <div style={styles.mlResultValue}>
                  {predictionData.ml_prediction_text}
                </div>
              </div>

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

              {/* --- NEW: 24-Hour Activity Planner --- */}
              {predictionData.hourly_plan && (
                <div style={styles.hourlyContainer}>
                  <h3 style={styles.hourlyTitle}>Your 24-Hour Activity Plan</h3>
                  {predictionData.hourly_plan.map((item, index) => {
                    // Get a clean time format (e.g., "09:00 PM")
                    const time = new Date(item.time + " UTC").toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute:'2-digit',
                      hour12: true 
                    });
                    
                    // --- Give recommendation a color ---
                    let recColor = '#cbd5e0'; // Default gray
                    if (item.recommendation.includes('Great') || item.recommendaction.includes('Perfect')) {
                      recColor = '#38b2ac'; // Green/Teal
                    } else if (item.recommendation.includes('Bad') || item.recommendation.includes('Don\'t')) {
                      recColor = '#f56565'; // Red
                    }

                    return (
                      <div key={index} style={styles.hourlyRow}>
                        <span style={styles.hourlyTime}>{time}</span>
                        <span style={{...styles.hourlyRecommendation, color: recColor}}>
                          {item.recommendation}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* --- End of Activity Planner --- */}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;