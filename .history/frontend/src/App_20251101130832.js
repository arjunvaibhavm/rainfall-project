import React, { useState } from 'react';
import axios from 'axios';

// --- Simple CSS styles as a JavaScript object ---
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
  },
  form: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px 25px',
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
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  button: {
    gridColumn: '1 / -1', // Make button span both columns
    padding: '12px',
    fontSize: '1.1rem',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  result: {
    marginTop: '30px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
  },
};
// --- End of styles ---

function App() {
  // 1. State to hold all the form data
  const [formData, setFormData] = useState({
    MinTemp: '10',
    MaxTemp: '25',
    Humidity9am: '70',
    Humidity3pm: '50',
    Pressure9am: '1010',
    Pressure3pm: '1008',
    WindSpeed9am: '10',
    WindSpeed3pm: '15',
    RainToday: 'No', // Default to 'No'
  });

  // 2. State to hold the prediction result from the API
  const [prediction, setPrediction] = useState('');
  const [error, setError] = useState('');

  // 3. Handle changes to any input field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // 4. Handle form submission when "Predict" is clicked
  const handleSubmit = (e) => {
    e.preventDefault(); // Stop the page from reloading
    setPrediction(''); // Clear old prediction
    setError(''); // Clear old error

    // --- Convert all our number strings to actual numbers ---
    // This is crucial for the model
    const dataToSend = {
      MinTemp: parseFloat(formData.MinTemp),
      MaxTemp: parseFloat(formData.MaxTemp),
      Humidity9am: parseFloat(formData.Humidity9am),
      Humidity3pm: parseFloat(formData.Humidity3pm),
      Pressure9am: parseFloat(formData.Pressure9am),
      Pressure3pm: parseFloat(formData.Pressure3pm),
      WindSpeed9am: parseFloat(formData.WindSpeed9am),
      WindSpeed3pm: parseFloat(formData.WindSpeed3pm),
      RainToday: formData.RainToday,
    };

    console.log("Sending data to Flask:", dataToSend);

    // 5. Send the data to our Flask API!
    axios.post('http://127.0.0.1:5000/predict', dataToSend)
      .then((response) => {
        // If successful, show the prediction
        console.log("Received response:", response.data);
        setPrediction(response.data.prediction_text);
      })
      .catch((err) => {
        // If there's an error, show it
        console.error("Error from API:", err);
        setError('Error: Could not get prediction.');
      });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🌦️ Indian Rainfall Predictor</h1>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* We use .map() to create all 8 number inputs cleanly */}
        {/* These keys must match the `formData` state exactly */}
        {['MinTemp', 'MaxTemp', 'Humidity9am', 'Humidity3pm', 'Pressure9am', 'Pressure3pm', 'WindSpeed9am', 'WindSpeed3pm'].map((key) => (
          <div style={styles.formGroup} key={key}>
            <label style={styles.label}>{key} (e.g., {formData[key]})</label>
            <input
              type="number"
              step="0.1"
              name={key}
              value={formData[key]}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
        ))}

        {/* The 'RainToday' dropdown */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Rain Today?</label>
          <select
            name="RainToday"
            value={formData.RainToday}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        <button type="submit" style={styles.button}>
          Predict Tomorrow's Rain
        </button>
      </form>

      {/* Show the prediction or an error message */}
      {prediction && (
        <h2 style={styles.result}>{prediction}</h2>
      )}
      {error && (
        <h2 style_={{ ...styles.result, color: 'red' }}>{error}</h2>
      )}
    </div>
  );
}

export default App;