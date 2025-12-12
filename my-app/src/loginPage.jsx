import React from 'react';

const googleURL = import.meta.env.VITE_GOOGLE_URL;

const STRINGS = {
  en: {
    heading: "Sharetea POS Login",
    prompt: "Please sign in to continue",
    button: "Sign in with Google",
  },
  es: {
    heading: "Inicio de sesión Sharetea POS",
    prompt: "Por favor inicia sesión para continuar",
    button: "Inicia sesión con Google",
  },
};

function LoginPage({ onLoginSuccess, language = "en" }) {
  const copy = STRINGS[language] || STRINGS.en;

  const handleGoogleLogin = () => {
    window.location.href = googleURL;
  };

  return (
    <div className="login-container">
      <h1>{copy.heading}</h1>
      <p>{copy.prompt}</p>
      <button onClick={handleGoogleLogin} className="google-btn">
        {copy.button}
      </button>
    </div>
  );
}

export default LoginPage;
