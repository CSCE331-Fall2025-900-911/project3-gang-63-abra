import React from 'react';
// Styles are now in App.css

/**
 * This is the dedicated Login Page component.
 */
function LoginPage({ onLoginSuccess }) {
  /**
   * This is your event handler function.
   * It's called when the user clicks the button.
   */
  const handleGoogleLogin = () => {
    // This URL MUST match the endpoint 
    // Confirm with him that his backend is running on port 8000.
    window.location.href = 'http://localhost:8000//auth/google';
    // In a real app, the backend would redirect back,
    // and you'd call onLoginSuccess() after getting confirmation.
    // For now, you can uncomment this to test the navigation:
    // onLoginSuccess(); 
  };

  return (
    // We use "login-container" from our App.css
    <div className="login-container">
      <h1>Share Tea POS Login</h1>
      <p>Please sign in to continue</p>
      
      {/* This is the Google login button */}
      <button onClick={handleGoogleLogin} className="google-btn">
        Sign in with Google
      </button>
    </div>
  );
}

export default LoginPage;
