import React, { useState } from 'react';
import CustomerKiosk from './CustomerKiosk.jsx'; // Import the kiosk
import LoginPage from './loginPage.jsx';       // Import the login page
import './App.css'; // This file will now hold styles for all components

function App() {
  // This state will control which page is visible.
  const [currentPage, setCurrentPage] = useState('kiosk');

  // This function will be passed to the LoginPage
  // so it can tell the App to switch views after a successful login.
  const handleLoginSuccess = () => {
    setCurrentPage('kiosk');
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
      // case 'manager_dashboard':
      //   return <ManagerDashboard />;
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
