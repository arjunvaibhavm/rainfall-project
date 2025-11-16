import React, { useState } from 'react';
import axios from 'axios'; // Make sure you have run 'npm install axios'
// --- IMPORT YOUR LOGO (assuming it's a .png in src/) ---
import logoSrc from './nimbus-logo.png'; // <-- CHECK THIS FILENAME!

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
    width: '100%',
    boxSizing: 'border-box',
  },
  // --- THE GLASS CARD IS BACK ---
  glassContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '1200px', // Wider card
    backgroundColor: 'rgba(45, 55, 72, 0.8)', // Dark Glass
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    marginTop: '20px',
    boxSizing: 'border-box',
  },
  header: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#f6e05e', // Nimbus Golden Color
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textShadow: '0px 1px 3px rgba(0,0,0,0.1)',
  },
  headerLogo: {
    height: '50px',
    width: '50px',
    objectFit: 'contain', // Use 'contain' for a PNG
    marginRight: '15px',
    // --- NO mixBlendMode needed for a PNG ---
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '15px', // Add spacing
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
    boxSizing: 'border-box',
    width: '100%', // Ensure it's full width
  },
  select: {
    padding: '14px',
    fontSize: '1.1rem',
    borderRadius: '10px',
    border: '1px solid #4a5568',
    backgroundColor: 'rgba(26, 32, 44, 0.7)',
    color: '#ffffff',
    boxSizing: 'border-box',
    width: '100%',
    appearance: 'none', // Remove default arrow
    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23cbd5e0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1.5em 1.5em',
  },
  button: {
    padding: '14px',
    fontSize: '1.1rem',
    color: '#1a202c', // Dark text
    backgroundColor: '#f6e05e', // Nimbus Golden Color
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '20px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 5px 15px rgba(246, 224, 94, 0.4)', // Golden shadow
  },
  resultsContainer: {
    marginTop: '30px',
    width: '100%',
    textAlign: 'center',
  },
  gridContainer: {
    display: 'grid',
    // --- UPDATED: Increased min size to force a 3-2 layout ---
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
    gap: '15px',
    width: '100%',
  },
  fullWidthItem: {
    gridColumn: '1 / -1', // Spans all columns
  },
  resultBox: {
    backgroundColor: 'rgba(26, 32, 44, 0.8)', // Darker box
    padding: '20px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '15px',
    border: '1px solid rgba(255, 255, 255, 0.1)', // Default subtle border
    transition: 'all 0.3s ease', // Smooth transition
    boxSizing: 'border-box',
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
  mlResultValue: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#f6e05e', // Nimbus Golden Color
    marginTop: '5px',
  },
  impactResultValue: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#ffffff', // White
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
    color: '#f56565', // Red
    textAlign: 'center',
    backgroundColor: 'rgba(254, 235, 235, 0.1)',
    padding: '15px',
    borderRadius: '10px',
  },
  scoutContainer: {
    gridColumn: '1 / -1',
    backgroundColor: 'rgba(76, 86, 106, 0.8)', // A different bg color
    padding: '20px',
    borderRadius: '15px',
    marginTop: '0px', // Sits right at the top
    marginBottom: '15px',
    border: '2px solid #f6e05e', // Nimbus Golden Color
    boxShadow: '0 4px 20px 0 rgba(246, 224, 94, 0.15)', // Golden shadow
  },
  scoutTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
    marginBottom: '15px',
    borderBottom: '1px solid #a0aec0',
    paddingBottom: '10px',
  },
  scoutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #4a5568',
  },
  scoutCity: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
  },
  scoutHours: { 
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#63b3ed', // Blue
  },
};
// --- End of styles ---

function App() {
  const [location, setLocation] = useState('Mumbai');
  const [predictionData, setPredictionData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activity, setActivity] = useState('run'); 
  
  // This is the local backend URL
  const API_URL = 'http://127.0.0.1:5000/predict'; 

  const handleSubmit = (e) => {
    e.preventDefault();
    setPredictionData(null);
    setError('');
    setIsLoading(true);

    const dataToSend = { 
      city: location,
      activity: activity,
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
    backgroundColor: isLoading ? '#4a5568' : '#f6e05e', // Use gray when loading
    cursor: isLoading ? 'not-allowed' : 'pointer',
  };

  return (
    <div style={styles.container}>
      {/* --- THE GLASS CARD IS BACK --- */}
      <div style={styles.glassContainer}>
        
        <h1 style={styles.header}>
          <img src={logoSrc} alt="Nimbus Logo" style={styles.headerLogo} />
          NIMBUS
        </h1>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Enter Your City:</label>
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
              name="activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              style={styles.select}
            >
              <option value="run">Go for a run</option>
              <option value="hang_laundry">Hang laundry outside</option>
              <option value="picnic">Plan a picnic</option>
              <option value="bike_commute">Commute by bike</option>
            </select>
          </div>

          <button 
            type="submit" 
            style={loadingButtonStyle} 
            disabled={isLoading}
            onMouseOver={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isLoading ? 'Analyzing...' : "Get Forecast & Scout Locations"}
          </button>
        </form>

        <div style={styles.resultsContainer}>
          {isLoading && <h2 style={{...styles.resultTitle, fontSize: '1.2rem', color: 'white'}}>Loading...</h2>}

          {!isLoading && error && (
            <div style={styles.error}>{error}</div>
          )}

          {!isLoading && predictionData && (
            <div style={styles.gridContainer}>

              {/* --- Location Scout Results --- */}
              {predictionData.location_ranking && (
                <div style={styles.scoutContainer}>
                  <h3 style={styles.scoutTitle}>🏆 Auto-Scouted Nearby Locations (Next 3 Hrs for {activity})</h3>
                  {predictionData.location_ranking.map((item, index) => {
                    let cityStyle = { ...styles.scoutCity };
                    let recStyle = { ...styles.scoutHours };

                    if (index === 0) {
                      cityStyle.color = '#f6e05e'; // Highlight winner
                    }

                    // --- Color code the recommendation ---
                    if (item.score === 2) { recStyle.color = '#38b2ac'; } // Green
                    else if (item.score === 1) { recStyle.color = '#f6e05e'; } // Yellow
                    else if (item.score === 0) { recStyle.color = '#f56565'; } // Red
                    
                    return (
                      <div key={index} style={styles.scoutRow}>
                        <span style={cityStyle}>
                          {index + 1}. {item.city}
                        </span>
                        {item.status === 'Analyzed' ? (
                          <span style={recStyle}>
                            {item.recommendation}
                          </span>
                        ) : (
                          <span style={{...styles.scoutHours, color: '#f56565'}}>
                            No Data
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* --- End of Location Scout --- */}

              {/* --- Recommendation Box (Top & Highlighted) --- */}
              <div style={{
                  ...styles.resultBox, 
                  ...styles.fullWidthItem,
                  border: '2px solid #f6e05e', // Highlight Yellow
                  boxShadow: '0 4px 20px 0 rgba(246, 224, 94, 0.15)'
                }}>
                <div style={styles.resultTitle}>🎯 ACTIVITY ADVICE (Next 3 Hours in {predictionData.city})</div>
                <div style={styles.recommendationValue}>
                  {predictionData.activity_recommendation}
                </div>
              </div>
              
              {/* --- Box 1: Intensity --- */}
              {/* These 5 boxes will now form a 3-2 grid */}
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>🚦 INTENSITY </div>
                <div style={styles.resultValue}>
                  {predictionData.intensity_tag}
                </div>
              </div>
              
              {/* --- Box 2: Impact --- */}
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>⚠️ IMPACT INDEX</div>
                <div style={styles.impactResultValue}>
                  {predictionData.impact_index}
                </div>
              </div>

              {/* --- Box 3: ML Confidence (MOVED INTO GRID) --- */}
              <div style={{
                  ...styles.resultBox, 
                  border: '2px solid #f6e05e', // Nimbus Golden Color
                  boxShadow: '0 4px 20px 0 rgba(246, 224, 94, 0.15)' // Golden shadow
                }}>
                <div style={styles.resultTitle}>🤖 ML CONFIDENCE SCORE (Your Model)</div>
                <div style={styles.mlResultValue}>
                  {predictionData.ml_prediction_text}
                </div>
              </div>

              {/* Box 4: Rain Amount */}
              <div style={styles.resultBox}>
                <div style={styles.resultTitle}>💧 FORECASTED RAIN</div>
                <div style={{...styles.resultValue, fontSize: '2rem'}}>
                  {predictionData.api_forecast_amount_mm.toFixed(2)} mm
                </div>
              </div>

              {/* Box 5: Temperature */}
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