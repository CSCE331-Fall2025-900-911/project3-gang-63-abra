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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-amber-50 px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-pink-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold border border-pink-100">
            Sharetea
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{copy.heading}</h1>
          <p className="text-sm text-gray-600">{copy.prompt}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold shadow-lg transition"
          >
            <span>{copy.button}</span>
          </button>
          <p className="text-xs text-center text-gray-400">
            Use your organization Google account to continue.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
