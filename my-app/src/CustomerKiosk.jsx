import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart, CheckCircle2, Check, Minus, Plus, X } from "lucide-react";

import { motion } from "framer-motion";
import { fetchMenu } from "./api";

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children, className = "", ...props }) => (
  <div className={`bg-white rounded-2xl shadow-md ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = "", ...props }) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
);

const FALLBACK_ITEMS = [
  { id: 1, name: "Classic Milk Tea", price: 4.5, category: "Milk Tea", isTopping: false },
  { id: 2, name: "Taro Milk Tea", price: 5.0, category: "Milk Tea", isTopping: false },
  { id: 3, name: "Brown Sugar Boba", price: 5.5, category: "Specialty", isTopping: false },
  { id: 4, name: "Matcha Latte", price: 5.25, category: "Latte", isTopping: false },
  { id: "t1", name: "Honey Boba", price: 0.75, category: "Toppings", isTopping: true },
  { id: "t2", name: "Crystal Jelly", price: 0.65, category: "Toppings", isTopping: true },
  /*Potential added options for toppings
  { id: "t3", name: "Strawberry Jelly", price: 0.65, category: "Toppings", isTopping: true },
  { id: "t4", name: "Popping Boba", price: 0.85, category: "Toppings", isTopping: true },
  { id: "t5", name: "Regular Boba", price: 0.5, category: "Toppings", isTopping: true },
  */  
];

export default function CustomerKiosk() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);
  const [phase, setPhase] = useState("browsing");
  const [category, setCategory] = useState("All");
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [translatorReady, setTranslatorReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchMenu();
        if (mounted) setItems(data);
      } catch (e) {
        if (mounted) {
          setItems(FALLBACK_ITEMS);
          setError("Unable to load live menu. Showing sample items.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const scriptId = "google-translate-script";
    const elementId = "google_translate_element";

    const ensureSelectReady = () => {
      const select = document.querySelector("select.goog-te-combo");
      if (select) {
        setTranslatorReady(true);
        return true;
      }
      return false;
    };

    const initTranslateElement = () => {
      if (!window.google || !window.google.translate) return;
      if (!window.__googleTranslateInitialized) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,es",
            autoDisplay: false,
          },
          elementId
        );
        window.__googleTranslateInitialized = true;
      }
      ensureSelectReady();
    };

    window.googleTranslateElementInit = initTranslateElement;

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      initTranslateElement();
    }

    const interval = setInterval(() => {
      if (ensureSelectReady()) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const drinks = useMemo(() => items.filter((it) => !it.isTopping), [items]);
  const toppings = useMemo(() => items.filter((it) => it.isTopping), [items]);

  const categories = useMemo(() => {
    const set = new Set(["All"]);
    drinks.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [drinks]);

  const filtered = useMemo(() => {
    if (category === "All") return drinks;
    return drinks.filter((it) => it.category === category);
  }, [drinks, category]);

  const makeLineKey = (drink, toppingSelections = []) => {
    const toppingIds = toppingSelections.map((t) => t.id ?? t.name ?? "t");
    return `${drink.id ?? drink.name}:${toppingIds.sort().join("|")}`;
  };

  const addToCart = (drink, toppingSelections = []) => {
    setCart((prev) => {
      const key = makeLineKey(drink, toppingSelections);
      const existing = prev.find((x) => x.key === key);
      if (existing) {
        return prev.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x));
      }
      return [
        ...prev,
        {
          key,
          id: drink.id,
          name: drink.name,
          price: drink.price,
          category: drink.category,
          toppings: toppingSelections,
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (key, delta) => {
    setCart((prev) => prev.map((x) => (x.key === key ? { ...x, qty: x.qty + delta } : x)).filter((x) => x.qty > 0));
  };

  const perItemTotal = (item) => {
    const toppingTotal = (item.toppings || []).reduce((sum, topping) => sum + (Number(topping.price) || 0), 0);
    return (Number(item.price) || 0) + toppingTotal;
  };

  const total = cart.reduce((sum, item) => sum + perItemTotal(item) * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const changeLanguage = (lang) => {
    const select = document.querySelector("select.goog-te-combo");
    if (!select) return;
    select.value = lang;
    select.dispatchEvent(new Event("change"));
    setCurrentLanguage(lang);
  };

  const languageButtonClass = (lang) =>
    `px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
      currentLanguage === lang
        ? "bg-pink-500 text-white border-pink-500"
        : "bg-white/90 text-slate-600 border-white/60 hover:border-pink-200"
    }`;

  const startCustomization = (drink) => {
    setSelectedDrink(drink);
    setSelectedToppings([]);
    setPhase("customizing");
  };

  const closeCustomizer = () => {
    setSelectedDrink(null);
    setSelectedToppings([]);
    setPhase("browsing");
  };

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.id === topping.id);
      if (exists) return prev.filter((t) => t.id !== topping.id);
      return [...prev, topping];
    });
  };

  const addSelectionToCart = () => {
    if (!selectedDrink) return;
    addToCart(selectedDrink, selectedToppings);
    closeCustomizer();
  };

  if (phase === "confirmed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-yellow-50 p-6 text-center">
        <CheckCircle2 className="text-green-500 w-16 h-16 mb-4" />
        <h1 className="text-3xl font-semibold">Order Confirmed</h1>
        <p className="text-gray-600 mt-2">Thank you for ordering from Share Tea.</p>
        <Button className="mt-6" onClick={() => setPhase("browsing")}>
          Back to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 relative">
      <div id="google_translate_element" className="hidden" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="pointer-events-none absolute -top-32 -right-16 w-80 h-80 bg-pink-200/40 blur-[120px]" />
        <div className="pointer-events-none absolute top-40 -left-10 w-72 h-72 bg-amber-200/40 blur-[120px]" />
      </div>

      <div
        className="relative z-10 w-full px-6 py-12 lg:px-16"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          paddingBlock: "clamp(32px, 6vw, 96px)",
          paddingInline: "clamp(24px, 5vw, 72px)",
        }}
      >
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-12">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-500 shadow">
              Share Tea
              <span className="h-1 w-1 rounded-full bg-pink-400" />
              Fresh Daily
            </span>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-slate-800">Share Tea Kiosk</h1>
              <p className="text-slate-500 text-lg">Handcrafted milk teas, toppings on tap, and a smoother kiosk flow.</p>
            </div>
            {error && <p className="text-sm text-amber-600">{error}</p>}
          </div>
          <div className="flex flex-col gap-4 w-full md:w-auto md:items-end">
            <div className="rounded-3xl border border-white/60 bg-white/80 px-6 py-4 shadow-lg backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-slate-400">Language</p>
              <p className="text-sm text-slate-500 mt-1">Use Google Translate to view the kiosk in Spanish.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={languageButtonClass("en")}
                  onClick={() => changeLanguage("en")}
                  disabled={!translatorReady || currentLanguage === "en"}
                >
                  English
                </button>
                <button
                  type="button"
                  className={languageButtonClass("es")}
                  onClick={() => changeLanguage("es")}
                  disabled={!translatorReady || currentLanguage === "es"}
                >
                  Español
                </button>
              </div>
              {!translatorReady && <p className="mt-2 text-xs text-amber-600">Loading Google Translate…</p>}
            </div>
            <button
              type="button"
              onClick={() => (cart.length ? setPhase("checkout") : null)}
              className={`w-full md:w-auto flex items-center gap-4 rounded-3xl border border-white/60 bg-white/80 px-6 py-4 shadow-lg backdrop-blur transition focus:outline-none focus:ring-4 focus:ring-pink-200 ${
                cart.length ? "hover:-translate-y-1" : "opacity-60"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500 text-white">
                <ShoppingCart />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase tracking-wide text-slate-400">Cart Summary</p>
                <p className="text-lg font-bold text-slate-800">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-slate-500">${total.toFixed(2)} • Tap to review</p>
              </div>
            </button>
          </div>
        </header>

        {phase === "browsing" && (
          <>
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <p className="text-xs uppercase tracking-widest text-slate-400">Browse by category</p>
              <div className="flex flex-wrap gap-3">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm border backdrop-blur ${
                      category === c
                        ? "bg-pink-500 text-white border-pink-500"
                        : "bg-white/80 text-slate-600 border-white/50 hover:border-pink-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid w-full gap-8 lg:gap-10 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-64 rounded-2xl bg-white shadow relative overflow-hidden">
                      <div className="absolute inset-0 animate-pulse">
                        <div className="h-32 bg-gray-200" />
                        <div className="p-4 space-y-2">
                          <div className="h-5 bg-gray-200 rounded w-2/3" />
                          <div className="h-4 bg-gray-100 rounded w-1/3" />
                          <div className="h-9 bg-gray-100 rounded w-full mt-4" />
                        </div>
                      </div>
                    </div>
                  ))
                : filtered.map((item) => (
                    <Card
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => startCustomization(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          startCustomization(item);
                        }
                      }}
                      className="relative h-full overflow-hidden border border-white/60 bg-white/80 shadow-lg backdrop-blur rounded-3xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                    >
                      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-pink-200/40" />
                      <CardContent className="relative flex h-full flex-col gap-4 text-left select-text">
                        <div className="space-y-2">
                          <p className="text-[11px] tracking-[0.3em] text-pink-400 font-semibold">{item.category || "Drink"}</p>
                          <h3 className="text-2xl font-semibold text-slate-800" title={item.name}>
                            {item.name}
                          </h3>
                          {item.description && <p className="text-sm text-slate-500 max-h-16 overflow-hidden">{item.description}</p>}
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <p className="text-2xl font-bold text-slate-800">${Number(item.price || 0).toFixed(2)}</p>
                          <span className="text-sm font-semibold text-pink-500">Tap to customize</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>

            {cart.length > 0 && (
              <div className="sticky bottom-4 mt-10 flex justify-end">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Button onClick={() => setPhase("checkout")} className="shadow-lg">
                    Checkout • {itemCount} • ${total.toFixed(2)}
                  </Button>
                </motion.div>
              </div>
            )}
          </>
        )}

        {phase === "checkout" && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-lg rounded-2xl p-6 mt-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Your Order</h2>
                <p className="text-gray-500">Review and confirm your items</p>
              </div>
              <button className="text-gray-500" onClick={() => setPhase("browsing")}>
                <X />
              </button>
            </div>

            <div className="divide-y mt-4">
              {cart.map((item) => (
                <div key={item.key} className="flex justify-between items-center py-3">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-gray-500">
                      ${(perItemTotal(item)).toFixed(2)} each
                    </p>
                    {item.toppings?.length > 0 && (
                      <p className="text-xs text-gray-400">
                        + {item.toppings.map((t) => `${t.name} (${t.price ? `$${Number(t.price).toFixed(2)}` : "included"})`).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-2 rounded-lg bg-gray-100" onClick={() => updateQty(item.key, -1)}>
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center">{item.qty}</span>
                    <button className="px-2 py-2 rounded-lg bg-gray-100" onClick={() => updateQty(item.key, 1)}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6">
              <h3 className="text-lg font-bold">Total: ${total.toFixed(2)}</h3>
              <div className="flex gap-3">
                <Button className="bg-gray-400 hover:bg-gray-500" onClick={() => setPhase("browsing")}>
                  Keep Browsing
                </Button>
                <Button onClick={() => setPhase("confirmed")}>Place Order</Button>
              </div>
            </div>
          </motion.div>
        )}
        {phase === "customizing" && selectedDrink && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-xl mt-10 border border-slate-200 p-10 space-y-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex-1 min-w-[240px] space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] text-pink-500 font-semibold">
                  {selectedDrink.category || "Drink"}
                </p>
                <h2 className="text-3xl font-bold text-slate-900">{selectedDrink.name}</h2>
                <p className="text-lg text-gray-500">
                  ${Number(selectedDrink.price || 0).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button className="bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-none" onClick={closeCustomizer}>
                  Back
                </Button>
                <button className="text-gray-400 hover:text-gray-600 p-2" onClick={closeCustomizer} aria-label="Close customizer">
                  <X />
                </button>
              </div>
            </div>

            {selectedDrink.description && (
              <p className="text-base leading-relaxed text-gray-600">{selectedDrink.description}</p>
            )}

            {toppings.length > 0 && (
              <section className="space-y-5">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-700">Add toppings</p>
                  <p className="text-xs text-gray-400">Tap any topping to toggle it. Active toppings get a checkmark and appear below.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {toppings.map((topping) => {
                    const active = selectedToppings.some((t) => t.id === topping.id);
                    return (
                      <button
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        aria-pressed={active}
                        className={`
                          group border-2 px-5 py-4 text-left transition 
                          ${active
                            ? "border-pink-500 bg-pink-50 text-pink-600 shadow-[0_0_0_2px_rgba(236,72,153,0.2)]"
                            : "border-slate-200 bg-white hover:border-pink-200"
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-base">{topping.name}</p>
                            <p className="text-sm text-gray-500">
                              {topping.price ? `+$${Number(topping.price).toFixed(2)}` : "Included"}
                            </p>
                          </div>
                          {active && (
                            <span className="inline-flex items-center gap-1 text-pink-500 text-sm font-semibold">
                              <Check className="w-4 h-4" />
                              Added
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Selected toppings</p>
                  {selectedToppings.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedToppings.map((topping) => (
                        <span
                          key={topping.id}
                          className="px-3 py-1 border border-pink-400 text-pink-600 text-xs font-semibold uppercase tracking-wide"
                        >
                          {topping.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">No toppings selected yet.</p>
                  )}
                </div>
              </section>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
              <Button className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-none" onClick={closeCustomizer}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-none" onClick={addSelectionToCart}>
                Add to Cart
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
