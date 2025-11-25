import React, { useEffect, useState } from "react";
import {
  fetchMenu,
  checkStock,
  submitOrder,
} from "./api";

const SALES_TAX_RATE = 0.0825;

export default function EmployeePanel({ onBack }) {
  const [menu, setMenu] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [qty, setQty] = useState("1");

  // Load menu (drinks + toppings)
  useEffect(() => {
    (async () => {
      const data = await fetchMenu();
      setMenu(data);
    })();
  }, []);

  const drinks = menu.filter((m) => !m.isTopping);
  const toppings = menu.filter((m) => m.isTopping);

  function roundDown(v) {
    return Math.floor(v * 100) / 100;
  }

  async function addItem(item) {
    const q = parseInt(qty, 10);
    if (!q || q <= 0) return alert("Quantity must be positive");

    // Stock check API
    const check = await checkStock(item.id, q);

    if (!check.ok) {
      alert(
        `Not enough stock for ${check.ingredient}\n` +
        `Needed: ${check.needed}, Available: ${check.available}`
      );
      return;
    }

    const subtotal = roundDown(item.price * q);

    setOrderItems((prev) => [
      ...prev,
      {
        itemId: item.id,
        name: item.name,
        qty: q,
        subtotal,
        isTopping: item.isTopping,
      },
    ]);
  }

  function removeItem(index) {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  }

  function clearOrder() {
    setOrderItems([]);
  }

  // compute totals
  const subtotal = roundDown(
    orderItems.reduce((sum, it) => sum + it.subtotal, 0)
  );
  const tax = roundDown(subtotal * SALES_TAX_RATE);
  const total = roundDown(subtotal + tax);

  async function handleSubmit() {
    if (!employeeId) return alert("Enter employee ID");
    if (orderItems.length === 0) return alert("No items in order");

    try {
      const result = await submitOrder({
        employeeId,
        items: orderItems.map((i) => ({
          itemId: i.itemId,
          qty: i.qty,
        })),
      });

      alert(
        `Order submitted!\n` +
        `Order ID: ${result.orderId}\n` +
        `Subtotal: $${result.subtotal}\n` +
        `Tax: $${result.tax}\n` +
        `Total: $${result.total}`
      );

      clearOrder();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  return (
    <div className="flex p-4 gap-4">
      
      {/* Left Column */}
      <div className="flex flex-col gap-4 w-2/3">

        {/* Employee ID + Qty */}
        <div className="flex gap-4 items-center">
          <label>Employee ID:</label>
          <input
            className="border px-2 py-1 w-24"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
          <label>Qty:</label>
          <input
            className="border px-2 py-1 w-20"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>

        {/* Drinks */}
        <div className="border rounded p-3">
          <h2 className="font-bold mb-2">Drinks</h2>
          <div className="grid grid-cols-3 gap-3">
            {drinks.map((d, i) => (
              <button
                key={d.id}
                className="border p-4 rounded bg-green-50 hover:bg-green-100"
                onClick={() => addItem(d)}
              >
                {i + 1} - {d.name}
                <div>${d.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Toppings */}
        <div className="border rounded p-3">
          <h2 className="font-bold mb-2">Toppings</h2>
          <div className="grid grid-cols-2 gap-3">
            {toppings.map((t, i) => (
              <button
                key={t.id}
                className="border p-4 rounded bg-blue-50 hover:bg-blue-100"
                onClick={() => addItem(t)}
              >
                +{i + 1} {t.name}
                <div>${t.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column (Cart + Totals) */}
      <div className="w-1/3 border rounded p-4 flex flex-col">

        <h2 className="font-bold mb-2">Cart</h2>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, i) => (
                <tr key={i}>
                  <td>{item.isTopping ? " - " : ""}{item.name}</td>
                  <td>{item.qty}</td>
                  <td>${item.subtotal.toFixed(2)}</td>
                  <td>
                    <button
                      className="text-red-600"
                      onClick={() => removeItem(i)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 text-center">
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          <div>Tax (8.25%): ${tax.toFixed(2)}</div>
          <div className="font-bold text-lg">Total: ${total.toFixed(2)}</div>
          <div className="text-sm italic">※ Prices shown before tax</div>

          <div className="mt-4 flex gap-2">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={handleSubmit}
            >
              Submit
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded"
              onClick={clearOrder}
            >
              Clear
            </button>
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded"
              onClick={onBack}
            >
              Back
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
