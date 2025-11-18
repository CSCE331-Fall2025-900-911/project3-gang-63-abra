import React, { useState, useEffect } from 'react';
import CustomerKiosk from './CustomerKiosk.jsx'; // Import the kiosk
import LoginPage from './loginPage.jsx';       // Import the login page
import ManagerPage from './ManagerPage.jsx';   // Import the manager page
import './App.css'; // This file will now hold styles for all components

function App() {
  // This state will control which page is visible.
  const [currentPage, setCurrentPage] = useState('kiosk');

  useEffect(() => {
    // Check if the user is already logged in
    fetch('/api/user', {
      credentials: 'include'  // Important: include credentials for session cookies
    })
      .then(response => response.json())
      .then(data => {
        if (data && !data.error) {
          // If the user is logged in, go to the manager page
          handleLoginSuccess();
        }
      })
      .catch(() => {
        // If there's an error, do nothing (stay on the kiosk/login page)
      });
  }, []); // The empty array means this effect runs once on component mount

  // This function will be passed to the LoginPage
  // so it can tell the App to switch views after a successful login.
  const handleLoginSuccess = () => {
    setCurrentPage('manager');
  };

  // This function lets us switch back to the login page (or any other page)
  const navigate = (page) => {
    setCurrentPage(page);
  };

  // Simple navigation bar to switch between views (for testing)
  const Navigation = () => (
    <nav className="navigation-bar">
      <button onClick={() => navigate('login')}>Login Page</button>
      <button onClick={() => navigate('kiosk')}>Customer Kiosk</button>
      <button onClick={() => navigate('manager')}>Manager Page</button>
      {/* You can add more buttons here as you build the Manager/Cashier views */}
    </nav>
  );

  // This function decides which component to show
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'kiosk':
        return <CustomerKiosk />;
      case 'manager':
        return <ManagerPage />;
      default:
        return <CustomerKiosk />;
    }
  };

  return (
    <div className="app-container">
      <Navigation />
      {renderCurrentPage()}
    </div>
  );
}

export default App;
