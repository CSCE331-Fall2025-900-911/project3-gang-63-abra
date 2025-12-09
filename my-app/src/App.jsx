import { fetchWeather } from './api.js';
import React, { useState, useEffect, useMemo } from 'react';
import CustomerKiosk from './CustomerKiosk.jsx'; // Import the kiosk
import LoginPage from './loginPage.jsx';       // Import the login page
import ManagerPage from './ManagerPage.jsx';   // Import the manager page
import EmployeePanel from './EmployeePanel.jsx';
import AccessibilityPanel from './AccessibilityPanel.jsx'; // Import accessibility panel
import './App.css'; // This file will now hold styles for all components

// Import the API_BASE configuration
const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.trim().replace(/\/$/, "")
  : "https://abra-backend.vercel.app/api";

const ALLOWED_EMAILS = [
  'athul.mohanram05@tamu.edu',
  'masonnguyen1223@tamu.edu',
  'prisha08@tamu.edu',
  'reveille.bubbletea@gmail.com',
  'zaheersufi@tamu.edu'
];

function App() {
  // This state will control which page is visible.
  const [currentPage, setCurrentPage] = useState('kiosk');
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);

  const isManager = useMemo(
    () => user?.email && ALLOWED_EMAILS.includes(user.email.toLowerCase()),
    [user]
  );

  useEffect(() => {
    // Check if the user is already logged in - use configured API_BASE instead of hardcoded localhost
    const loadUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/user`, {
          credentials: 'include'  // Important: include credentials for session cookies
        });
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = await res.json();
        if (data && !data.error) {
          setUser(data);
          if (ALLOWED_EMAILS.includes((data.email || "").toLowerCase())) {
            handleLoginSuccess(data);
          } else {
            setCurrentPage('kiosk');
          }
        }
      } catch {
        setUser(null);
      }
    };

    loadUser();
  }, []); // The empty array means this effect runs once on component mount

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const data = await fetchWeather("College Station"); // or any city
        setWeather(data);
      } catch (err) {
        console.error("Failed to fetch weather:", err);
      }
    };
    loadWeather();
  }, []);

  // This function will be passed to the LoginPage
  // so it can tell the App to switch views after a successful login.
  const handleLoginSuccess = (userData = user) => {
    const nextUser = userData || user;
    setUser(nextUser);
    if (nextUser?.email && ALLOWED_EMAILS.includes(nextUser.email.toLowerCase())) {
      setCurrentPage('employee');
    } else {
      setCurrentPage('kiosk');
    }
  };

  // This function lets us switch back to the login page (or any other page)
  const navigate = (page) => {
    if ((page === 'manager' || page === 'employee') && !isManager) {
      setCurrentPage('login');
      return;
    }
    setCurrentPage(page);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, { credentials: 'include' });
    } catch {
      // ignore logout errors; still clear local state
    } finally {
      setUser(null);
      setCurrentPage('login');
    }
  };

  // Simple navigation bar to switch between views (for testing)
  const Navigation = ({ weather }) => (
    <nav className="navigation-bar">
      <div className="nav-links">
        <button onClick={() => navigate('login')}>Login Page</button>
        <button onClick={() => navigate('kiosk')}>Customer Kiosk</button>
        {isManager && (
          <>
            <button onClick={() => navigate('manager')}>Manager Page</button>
            <button onClick={() => navigate('employee')}>Employee Panel</button>
          </>
        )}
      </div>
      {weather && (
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600">
          {(weather.main.temp * 9/5 + 32).toFixed(1)}°F - {weather.weather[0].main}
        </button>
      )}
      <div className="account-section">
        <span>{user?.email ? `Signed in as ${user.email}` : 'Not signed in'}</span>
        {user?.email && (
          <button className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        )}
      </div>
      {/* You can add more buttons here as you build the Manager/Cashier views */}
    </nav>
  );

  // This function decides which component to show
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'kiosk':
        return <CustomerKiosk user={user} />;
      case 'manager':
        return isManager ? <ManagerPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'employee':
        return isManager ? <EmployeePanel /> : <LoginPage onLoginSuccess={handleLoginSuccess} />;
      default:
        return <CustomerKiosk />;
    }
  };

  return (
    <div className="app-container">
      <Navigation weather={weather} />
      {renderCurrentPage()}
      <AccessibilityPanel />
    </div>
  );
}

export default App;
