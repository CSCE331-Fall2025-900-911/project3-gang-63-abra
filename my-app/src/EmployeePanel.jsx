import React, { useEffect, useState } from "react";

export default function EmployeePanel() {
  const [items, setItems] = useState([]);
  const [drinkOptions, setDrinkOptions] = useState([]);
  const [toppingOptions, setToppingOptions] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // GOOGLE TRANSLATE LOADER
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en" },
        "google_translate_element"
      );
    };
  }, []);

  // LOAD MENU ITEMS FROM BACKEND
  useEffect(() => {
    fetch("http://localhost:5000/api/menu")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setDrinkOptions(data.filter((i) => !i.is_topping));
        setToppingOptions(data.filter((i) => i.is_topping));
      });
  }, []);

  // ADD ITEM TO CART
  const addToCart = () => {
    if (!selectedDrink) return;

    const totalPrice =
      selectedDrink.price * quantity +
      selectedToppings.reduce((acc, t) => acc + t.price, 0) * quantity;

    const item = {
      name:
        selectedDrink.name +
        (selectedToppings.length
          ? " + " + selectedToppings.map((t) => t.name).join(", ")
          : ""),
      quantity,
      subtotal: totalPrice,
    };

    setCart([...cart, item]);
    setQuantity(1);
    setSelectedDrink(null);
    setSelectedToppings([]);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-white p-6">
      {/* GOOGLE TRANSLATE */}
      <div id="google_translate_element" className="mb-4"></div>

      {/* PAGE TITLE */}
      <h1 className="text-4xl font-extrabold text-center text-pink-600 mb-6 drop-shadow">
        Employee Panel
      </h1>

      {/* POINTS SECTION */}
      <div className="bg-white shadow-md rounded-2xl p-4 mb-6 border border-pink-200">
        <h2 className="text-xl font-semibold text-pink-600">Customer Points</h2>
        <p className="text-gray-600 mt-2">This section is decorative only.</p>
        <div className="mt-3 flex gap-4 items-center">
          <input
            placeholder="Enter Phone Number"
            className="border rounded-xl px-4 py-2 w-60 focus:ring-2 focus:ring-pink-400"
          />
          <button className="bg-pink-500 text-white px-4 py-2 rounded-xl shadow hover:bg-pink-600">
            Check Points
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* DRINKS */}
        <div className="bg-white rounded-2xl p-4 shadow border border-pink-200">
          <h2 className="text-xl font-semibold text-pink-600 mb-3">Drinks</h2>
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
            {drinkOptions.map((item) => (
              <button
                key={item.id}
                className={`p-3 rounded-xl border ${
                  selectedDrink?.id === item.id
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100"
                } hover:bg-pink-100`}
                onClick={() => setSelectedDrink(item)}
              >
                {item.name} — ${item.price.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        {/* TOPPINGS */}
        <div className="bg-white rounded-2xl p-4 shadow border border-pink-200">
          <h2 className="text-xl font-semibold text-pink-600 mb-3">Toppings</h2>
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
            {toppingOptions.map((item) => (
              <button
                key={item.id}
                className={`p-3 rounded-xl border ${
                  selectedToppings.includes(item)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100"
                } hover:bg-pink-100`}
                onClick={() => {
                  setSelectedToppings((prev) =>
                    prev.includes(item)
                      ? prev.filter((t) => t.id !== item.id)
                      : [...prev, item]
                  );
                }}
              >
                {item.name} — ${item.price.toFixed(2)}
              </button>
            ))}
          </div>

          {/* QUANTITY */}
          <div className="mt-4">
            <h3 className="font-semibold text-pink-600 mb-2">Quantity</h3>
            <input
              type="number"
              min={1}
              className="border rounded-xl px-3 py-2 w-20 text-center"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
          </div>

          {/* ADD BUTTON */}
          <button
            className="w-full mt-4 bg-pink-500 text-white py-3 rounded-xl shadow hover:bg-pink-600"
            onClick={addToCart}
          >
            Add to Cart
          </button>
        </div>

        {/* CART */}
        <div className="bg-white rounded-2xl p-4 shadow border border-pink-200">
          <h2 className="text-xl font-semibold text-pink-600 mb-3">Cart</h2>

          <table className="w-full text-left">
            <thead>
              <tr className="text-pink-600">
                <th>Item</th>
                <th>Qty</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => (
                <tr key={index} className="border-t">
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.subtotal.toFixed(2)}</td>
                  <td>
                    <button
                      className="text-red-500"
                      onClick={() => removeFromCart(index)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTAL */}
          <div className="mt-4 text-xl font-bold text-right text-pink-600">
            Total: ${total.toFixed(2)}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-xl hover:bg-gray-400"
              onClick={clearCart}
            >
              Clear Cart
            </button>
            <button className="flex-1 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600">
              Submit Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
