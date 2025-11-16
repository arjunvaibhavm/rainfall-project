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
    animation: 'fadeIn 1.5s ease-out',
  },
  logoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '50px',
    maxWidth: '800px',
    width: '100%',
  },
  logoItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '10px',
    // --- THIS IS THE CSS TRICK ---
    // This makes the black background disappear
    mixBlendMode: 'lighten', 
  },
  mainLogo: {
    width: '250px',
    height: '250px',
    objectFit: 'cover', 
    marginBottom: '30px',
    animation: 'pulse 2s infinite alternate',
    borderRadius: '20px',
    // --- THIS IS THE CSS TRICK ---
    // This makes the black background disappear
    mixBlendMode: 'lighten', 
  },
  appName: {
    fontSize: '4.5rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#f6e05e', // Golden color
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
    letterSpacing: '5px',
    animation: 'slideInUp 1.5s ease-out',
  },
  tagline: {
    fontSize: '1.5rem',
    color: '#cbd5e0',
    marginBottom: '40px',
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
      {/* Smaller logos displayed everywhere */}
      <div style={styles.logoGrid}>
        {[...Array(9)].map((_, i) => ( // Display 9 small logos
          <div key={i} style={styles.logoItem}>
            {/* Use the imported logoSrc here */}
            <img src={logoSrc} alt="NIMBUS Logo Small" style={styles.logo} />
          </div>
        ))}
      </div>

      {/* Main content */}
      {/* Use the imported logoSrc here */}
      <img src={logoSrc} alt="NIMBUS Main Logo" style={styles.mainLogo} />
      <h1 style={styles.appName}>NIMBUS</h1>
      <p style={styles.tagline}>Your Personal Weather & Activity Scout</p>
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