import React from 'react';

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
    // Add keyframes inline for simplicity
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
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 5px rgba(246, 224, 94, 0.5))',
  },
  mainLogo: {
    width: '250px',
    height: '250px',
    objectFit: 'contain',
    marginBottom: '30px',
    filter: 'drop-shadow(0 0 15px rgba(246, 224, 94, 0.7))',
    animation: 'pulse 2s infinite alternate',
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
  0% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(246, 224, 94, 0.5)); }
  100% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(246, 224, 94, 0.9)); }
}
`;

// Add animations to a style tag
// This is a common pattern in React when not using CSS files
if (!document.getElementById('nimbus-animations')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "nimbus-animations";
  styleSheet.type = "text/css";
  styleSheet.innerText = keyframes;
  document.head.appendChild(styleSheet);
}


const WelcomePage = ({ onEnterApp }) => {
  // --- IMPORTANT ---
  // To add your logo:
  // 1. Save your logo image (with the background removed) into the `frontend/src/` folder.
  //    Let's say you name it `nimbus-logo.png`.
  // 2. At the top of this file, add this import:
  //    import logoSrc from './nimbus-logo.png';
  // 3. Then, you can use it like this:
  //    <img src={logoSrc} ... />
  //
  // For now, I'll use a text placeholder.
  const LogoPlaceholder = () => (
    <div style={{...styles.logo, border: '2px dashed #f6e05e', color: '#f6e05e', alignItems: 'center', justifyContent: 'center', display: 'flex', fontSize: '0.8rem', padding: '10px'}}>
      Your Logo
    </div>
  );
  
  const MainLogoPlaceholder = () => (
    <div style={{...styles.mainLogo, border: '3px dashed #f6e05e', color: '#f6e05e', alignItems: 'center', justifyContent: 'center', display: 'flex', fontSize: '1.5rem', padding: '20px'}}>
      Your Main Logo
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Smaller logos displayed everywhere */}
      <div style={styles.logoGrid}>
        {[...Array(9)].map((_, i) => ( // Display 9 small logos
          <div key={i} style={styles.logoItem}>
            <LogoPlaceholder />
          </div>
        ))}
      </div>

      {/* Main content */}
      <MainLogoPlaceholder />
      <h1 style={styles.appName}>NIMBUS</h1>
      <p style={styles.tagline}>Your Personal Weather & Activity Scout</p>
      <button style={styles.button} onClick={onEnterApp} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
        Enter App
      </button>
    </div>
  );
};

export default WelcomePage;