import React from 'react';
// --- IMPORT YOUR LOGO DIRECTLY ---
// Make sure your .jpg file is in the frontend/src/ folder
import logoSrc from './Gemini_Generated_Image_7sb4io7sb4io7sb4.png'; 

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a202c', // Dark Charcoal background
    color: '#ffffff', // White text
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Arial, sans-serif',
    textAlign: 'center',
    padding: '20px',
    // Staging the main fade-in
    animation: 'fadeIn 1.5s ease-out',
  },
  // --- REMOVED LOGO GRID ---
  mainLogo: {
    width: '250px',
    height: '250px',
    objectFit: 'cover', 
    marginBottom: '30px',
    animation: 'pulse 2s infinite alternate, fadeIn 2s ease-out', // Keep pulse, add fade-in
    borderRadius: '20px',
    mixBlendMode: 'lighten', // Keep this trick to remove black background
  },
  appName: {
    fontSize: '4.5rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#f6e05e', // Golden color
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
    letterSpacing: '5px',
    // Staged animation
    animation: 'slideInUp 1s ease-out 0.5s', // Delays 0.5s
    animationFillMode: 'backwards', // Starts invisible
  },
  tagline: {
    fontSize: '1.5rem',
    color: '#cbd5e0',
    marginBottom: '40px',
    // Staged animation
    animation: 'slideInUp 1s ease-out 1s', // Delays 1s
    animationFillMode: 'backwards', // Starts invisible
  },
  button: {
    padding: '15px 40px',
    fontSize: '1.3rem',
    color: '#1a202c', // Dark text
    backgroundColor: '#f6e05e', // Golden button
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 5px 15px rgba(246, 224, 94, 0.4)',
    // Staged animation
    animation: 'slideInUp 1s ease-out 1.5s', // Delays 1.5s
    animationFillMode: 'backwards', // Starts invisible
  },
};

// We must inject the animations into the document head
const keyframes = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideInUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.05); }
}
`;

// Add animations to a style tag
if (!document.getElementById('nimbus-animations')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "nimbus-animations";
  styleSheet.type = "text/css";
  styleSheet.innerText = keyframes;
  document.head.appendChild(styleSheet);
}


const WelcomePage = ({ onEnterApp }) => {
  return (
    <div style={styles.container}>
      {/* --- REMOVED LOGO GRID --- */}
      
      {/* Main content */}
      <img src={logoSrc} alt="NIMBUS Main Logo" style={styles.mainLogo} />
      <h1 style={styles.appName}>NIMBUS</h1>
      <p style={styles.tagline}>Your Personal Rainfall Predictor & Activity Scout</p>
      <button 
        style={styles.button} 
        onClick={onEnterApp} 
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} 
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        Enter App
      </button>
    </div>
  );
};

export default WelcomePage;