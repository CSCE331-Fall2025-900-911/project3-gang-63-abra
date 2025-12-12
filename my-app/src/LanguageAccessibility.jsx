import React, { useEffect, useState } from "react";

const SUPPORTED_LANGUAGES = ["English", "Español"];

const copy = {
  en: {
    title: "Language & Accessibility",
    intro:
      "This page explains how language support works in the kiosk. It is available only to employees and managers.",
    howTitle: "How Translation Works",
    howPoints: [
      "Kiosks use controlled, first-party English and Spanish strings to keep menu names and prices accurate.",
      "Language choice happens at the navbar toggle and flows into the kiosk and login experience without touching order logic.",
      "Menu items and toppings localize when a translation exists; otherwise they safely fall back to English.",
      "No external translation scripts are injected into kiosk, cart, rewards, or checkout flows.",
    ],
    supportedTitle: "Official Kiosk Languages",
    optionalTitle: "Optional Translation Tool (Employee Reference Only)",
    optionalBody:
      "Google Translate is available here for ad-hoc reference only. Automated translations may not reflect official menu names or prices—always rely on the controlled kiosk strings when assisting customers.",
    widgetNote: "Translation widget (isolated to this page only)",
  },
  es: {
    title: "Idiomas y Accesibilidad",
    intro:
      "Esta página explica cómo funciona el soporte de idiomas en el kiosco. Está disponible solo para empleados y gerentes.",
    howTitle: "Cómo funciona la traducción",
    howPoints: [
      "Los kioscos usan cadenas internas en inglés y español para mantener nombres y precios precisos.",
      "La selección de idioma se realiza en el botón del navbar y se aplica al kiosco y al inicio de sesión sin tocar la lógica de pedidos.",
      "Los productos y toppings se muestran traducidos cuando existe la cadena; de lo contrario, se muestran en inglés.",
      "No se inyectan scripts de traducción externos en el kiosco, el carrito, recompensas ni en el flujo de pago.",
    ],
    supportedTitle: "Idiomas oficiales del kiosco",
    optionalTitle: "Herramienta de traducción opcional (solo referencia)",
    optionalBody:
      "Google Translate está disponible aquí solo como referencia. Las traducciones automáticas pueden no reflejar los nombres o precios oficiales—usa siempre las cadenas controladas del kiosco al ayudar a los clientes.",
    widgetNote: "Widget de traducción (solo en esta página)",
  },
};

export default function LanguageAccessibility({ language = "en" }) {
  const c = copy[language] || copy.en;
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    const scriptId = "gt-script-lang-access";
    const existing = document.getElementById(scriptId);

    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        // eslint-disable-next-line no-new
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,es",
            autoDisplay: false,
          },
          "gt-widget"
        );
        setWidgetLoaded(true);
      }
    };

    if (!existing) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }

    return () => {
      const container = document.getElementById("gt-widget");
      if (container) container.innerHTML = "";
      delete window.googleTranslateElementInit;
      const scriptTag = document.getElementById(scriptId);
      if (scriptTag) scriptTag.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">{c.title}</h1>
          <p className="mt-2 text-gray-600">{c.intro}</p>
        </header>

        <section className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">{c.howTitle}</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            {c.howPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">{c.supportedTitle}</h2>
          <div className="flex flex-wrap gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-sm font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{c.optionalTitle}</h2>
            <span className="text-xs uppercase tracking-wide text-gray-500">Internal Only</span>
          </div>
          <p className="text-gray-700">{c.optionalBody}</p>
          <div className="mt-3 border border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">{c.widgetNote}</p>
            <div id="gt-widget" className="min-h-[48px]" />
            {!widgetLoaded && (
              <p className="text-xs text-gray-400 mt-2">Loading Google Translate…</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
