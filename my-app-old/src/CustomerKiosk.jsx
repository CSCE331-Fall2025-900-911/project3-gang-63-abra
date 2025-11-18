import React, { useState } from "react";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
// Note: You will need to run `npm install lucide-react framer-motion`
// in your terminal.

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
    img: "https://img.cdn4dd.com/cdn-cgi/image/fit=contain,width=1200,height=672,format=auto/https://doordash-static.s3.amazonaws.com/media/photosV2/9609f640-431d-4952-949b-be3d6e83e335-retina-large.png",
  },
  {
    id: 2,
    name: "Taro Milk Tea",
    price: 5.0,
    img: "https://placehold.co/600x400/C9A9D9/FFFFFF?text=Taro+Milk+Tea",
  },
  {
    id: 3,
    name: "Mango Green Tea",
    price: 4.75,
    img: "https://placehold.co/600x400/FFD700/FFFFFF?text=Mango+Green+Tea",
  },
];

const KioskHeader = ({ cartCount, onCheckout }) => (
  <header className="flex justify-between items-center p-6 bg-white shadow-md rounded-2xl">
    <h1 className="text-3xl font-bold text-gray-800">Welcome to Share Tea!</h1>
    <Button onClick={onCheckout} className="relative">
      <ShoppingCart className="mr-2" />
      View Cart
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Button>
  </header>
);

function CustomerKiosk() {
  const [cart, setCart] = useState([]);
  const [phase, setPhase] = useState("browsing"); // browsing, checkout, confirmed

  const addToCart = (drink) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === drink.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === drink.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...drink, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) => {
      const item = prevCart.find((item) => item.id === id);
      if (item.qty + delta <= 0) {
        return prevCart.filter((item) => item.id !== id); // Remove item
      }
      return prevCart.map((item) =>
        item.id === id ? { ...item, qty: item.qty + delta } : item
      );
    });
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  if (phase === "confirmed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <CheckCircle2 className="text-green-500 h-24 w-24 mx-auto" />
          <h1 className="text-4xl font-bold mt-6 mb-2">Order Confirmed!</h1>
          <p className="text-xl text-gray-400 mb-8">
            Please pick up your order shortly.
          </p>
          <Button onClick={() => {
            setCart([]);
            setPhase("browsing");
          }}>
            Place New Order
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <KioskHeader cartCount={cartCount} onCheckout={() => setPhase("checkout")} />

      {phase === "browsing" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
        >
          {drinks.map((drink) => (
            <Card key={drink.id} className="overflow-hidden">
              <img
                src={drink.img}
                alt={drink.name}
                className="w-full h-48 object-cover"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400/pink/white?text=Drink'; }}
              />
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-800">{drink.name}</h2>
                <p className="text-gray-500">${drink.price.toFixed(2)}</p>
                <Button className="w-full mt-4" onClick={() => addToCart(drink)}>
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {phase === "checkout" && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-lg rounded-2xl p-6 mt-6 text-gray-800"
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
  );
}

export default CustomerKiosk;