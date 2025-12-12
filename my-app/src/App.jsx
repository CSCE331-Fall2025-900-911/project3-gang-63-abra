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

const UI_STRINGS = {
  en: {
    loginPage: "Login Page",
    customerKiosk: "Customer Kiosk",
    managerPage: "Manager Page",
    employeePanel: "Employee Panel",
    signedInAs: (email) => `Signed in as ${email}`,
    notSignedIn: "Not signed in",
    signOut: "Sign out",
  },
  es: {
    loginPage: "Página de inicio de sesión",
    customerKiosk: "Kiosco de clientes",
    managerPage: "Página del gerente",
    employeePanel: "Panel de empleado",
    signedInAs: (email) => `Conectado como ${email}`,
    notSignedIn: "No has iniciado sesión",
    signOut: "Cerrar sesión",
  },
};

function App() {
  // This state will control which page is visible.
  const [currentPage, setCurrentPage] = useState('kiosk');
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);
  const [language, setLanguage] = useState('en');

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
        <button onClick={() => navigate('login')}>{UI_STRINGS[language].loginPage}</button>
        <button onClick={() => navigate('kiosk')}>{UI_STRINGS[language].customerKiosk}</button>
        {isManager && (
          <>
            <button onClick={() => navigate('manager')}>{UI_STRINGS[language].managerPage}</button>
            <button onClick={() => navigate('employee')}>{UI_STRINGS[language].employeePanel}</button>
          </>
        )}
      </div>
      <div className="nav-links" style={{ gap: '8px' }}>
        <button
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'active' : ''}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('es')}
          className={language === 'es' ? 'active' : ''}
        >
          Español
        </button>
      </div>
      {weather && (
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600">
          {(weather.main.temp * 9/5 + 32).toFixed(1)}°F - {weather.weather[0].main}
        </button>
      )}
      <div className="account-section">
        <span>
          {user?.email ? UI_STRINGS[language].signedInAs(user.email) : UI_STRINGS[language].notSignedIn}
        </span>
        {user?.email && (
          <button className="logout-btn" onClick={handleLogout}>
            {UI_STRINGS[language].signOut}
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
        return <LoginPage onLoginSuccess={handleLoginSuccess} language={language} />;
      case 'kiosk':
        return <CustomerKiosk user={user} language={language} />;
      case 'manager':
        return isManager ? <ManagerPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} language={language} />;
      case 'employee':
        return isManager ? <EmployeePanel /> : <LoginPage onLoginSuccess={handleLoginSuccess} language={language} />;
      default:
        return <CustomerKiosk user={user} language={language} />;
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
