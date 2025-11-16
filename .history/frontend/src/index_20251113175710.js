import React, { useState } from 'react'; // We need to import 'useState'
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // This is your main weather app
import WelcomePage from './WelcomePage'; // This is your new welcome page
import reportWebVitals from './reportWebVitals';

// We'll create a new "Root" component to manage which page is visible
const Root = () => {
  // We use a 'state' variable to track if we should show the welcome page
  const [showWelcome, setShowWelcome] = useState(true);

  // This function will be passed to the WelcomePage button
  // When called, it will set 'showWelcome' to false
  const handleEnterApp = () => {
    setShowWelcome(false);
  };

  // This is the logic:
  // IF 'showWelcome' is true, render the WelcomePage.
  // ELSE, render the main App.
  if (showWelcome) {
    return <WelcomePage onEnterApp={handleEnterApp} />;
  } else {
    return <App />;
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();