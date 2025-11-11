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
    maxWidth: '400px', // Set a max width for larger screens
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
  result: {
    marginTop: '30px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  error: {
    marginTop: '30px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#D8000C', // A red color for errors
    textAlign: 'center',
  }
};
// --- End of styles ---

function App() {
  // 1. State to hold the city name
  const [location, setLocation] = useState('Mumbai'); // Default city
  
  // 2. State for prediction, error, and loading
  const [prediction, setPrediction] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // To show loading text

  // 3. Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Stop the page from reloading
    setPrediction('');  // Clear old prediction
    setError('');       // Clear old error
    setIsLoading(true); // Start loading

    // 4. Data to send is just the location
    const dataToSend = {
      location: location // e.g., { "location": "Mumbai" }
    };

    console.log("Sending city to Flask:", dataToSend);

    // 5. Send the data to our Flask API
    axios.post('http://127.0.0.1:5000/predict', dataToSend)
      .then((response) => {
        // If successful, show the prediction
        console.log("Received response:", response.data);
        setPrediction(response.data.prediction_text);
      })
      .catch((err) => {
        // If there's an error (like "City not found")
        console.error("Error from API:", err);
        if (err.response && err.response.data && err.response.data.error) {
            setError(err.response.data.error); // Show specific error from Flask
        } else {
            setError('Error: Could not get prediction.'); // Generic error
        }
      })
      .finally(() => {
        setIsLoading(false); // Stop loading, whether success or error
      });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🌦️ Indian Rainfall Predictor</h1>
      
      {/* --- This is the simple, 1-input form --- */}
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
          {isLoading ? 'Predicting...' : "Predict Tomorrow's Rain"}
        </button>
      </form>

      {/* Show the loading text, the prediction, or an error message */}
      {isLoading && <h2 style={styles.result}>Loading...</h2>}

      {!isLoading && prediction && (
        <h2 style={styles.result}>{prediction}</h2>
      )}

      {!isLoading && error && (
        <h2 style={styles.error}>{error}</h2>
      )}
    </div>
  );
}

export default App;
