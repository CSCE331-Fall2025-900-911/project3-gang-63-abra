import React, { useState } from "react";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// Simple replacements for shadcn/ui components
const Button = ({ children, className = "", ...props }) => (
  <button
    className={`bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-md ${className}`}>{children}</div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const drinks = [
  {
    id: 1,
    name: "Classic Milk Tea",
    price: 4.5,
    img: "https://www.ohhowcivilized.com/wp-content/uploads/bubble-tea-boba-11.jpg",
  },
  {
    id: 2,
    name: "Taro Milk Tea",
    price: 5.0,
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsfbvmdftWbe81KO24-xs0dhanCnIAD3ZLwA&s",
  },
  {
    id: 3,
    name: "Brown Sugar Boba",
    price: 5.5,
    img: "https://images.unsplash.com/photo-1590080875832-4c1e1b1f1c5c?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 4,
    name: "Matcha Latte",
    price: 5.25,
    img: "https://images.unsplash.com/photo-1613470208231-99a8f61db6d1?auto=format&fit=crop&w=500&q=80",
  },
];

export default function ShareTeaKiosk() {
  const [cart, setCart] = useState([]);
  const [phase, setPhase] = useState("browsing"); // browsing | checkout | confirmed

  const addToCart = (drink) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === drink.id);
      if (existing) {
        return prev.map((item) =>
          item.id === drink.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...drink, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (phase === "confirmed") {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <CheckCircle2 className="text-green-500 w-16 h-16 mb-4" />
        <h1 className="text-3xl font-semibold">Order Confirmed!</h1>
        <p className="text-gray-600 mt-2">
          Thank you for ordering from Share Tea 🍹
        </p>
        <Button className="mt-6" onClick={() => setPhase("browsing")}>
          Back to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600">🧋 Share Tea Kiosk</h1>
          <div className="flex items-center gap-2">
            <ShoppingCart />
            <span className="font-semibold">{cart.length} items</span>
          </div>
        </header>

        {phase === "browsing" && (
          <>
            <h2 className="text-xl font-semibold mb-4">Select Your Drink</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {drinks.map((drink) => (
                <Card
                  key={drink.id}
                  className="overflow-hidden shadow-md hover:shadow-lg transition flex flex-col items-center"
                >
                  <div className="w-24 h-24 flex justify-center items-center overflow-hidden mt-4">
                    <img
                      src={drink.img}
                      alt={drink.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="text-lg font-semibold">{drink.name}</h3>
                    <p className="text-gray-600">${drink.price.toFixed(2)}</p>
                    <Button className="mt-3 w-full" onClick={() => addToCart(drink)}>
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}

            </div>

            {cart.length > 0 && (
              <div className="mt-10 flex justify-end">
                <Button onClick={() => setPhase("checkout")}>Checkout</Button>
              </div>
            )}
          </>
        )}

        {phase === "checkout" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-lg rounded-2xl p-6 mt-6"
          >
            <h2 className="text-2xl font-semibold mb-4">🧾 Your Order</h2>
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b py-3"
              >
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-500">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => updateQty(item.id, -1)}>-</Button>
                  <span>{item.qty}</span>
                  <Button onClick={() => updateQty(item.id, 1)}>+</Button>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center mt-6">
              <h3 className="text-lg font-bold">Total: ${total.toFixed(2)}</h3>
              <div className="flex gap-3">
                <Button className="bg-gray-400 hover:bg-gray-500" onClick={() => setPhase("browsing")}>
                  Back
                </Button>
                <Button onClick={() => setPhase("confirmed")}>Place Order</Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
