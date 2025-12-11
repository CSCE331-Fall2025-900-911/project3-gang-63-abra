import React, { useEffect, useState } from "react";
import { fetchMenu, checkStock, submitOrder } from "./api";

const SALES_TAX_RATE = 0.0825;

export default function EmployeePanel({ onBack }) {
  const [menu, setMenu] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [qty, setQty] = useState("1");

  const [customizingItem, setCustomizingItem] = useState(null);
  const [iceLevel, setIceLevel] = useState("Regular");
  const [sugarLevel, setSugarLevel] = useState("100%");
  const [selectedToppings, setSelectedToppings] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await fetchMenu();
      setMenu(data);
    })();
  }, []);

  const drinks = menu.filter((m) => !m.isTopping);
  const toppings = menu.filter((m) => m.isTopping);

  const roundDown = (v) => Math.floor(v * 100) / 100;

  function customizeDrink(drink) {
    setCustomizingItem(drink);
    setIceLevel("Regular");
    setSugarLevel("100%");
    setSelectedToppings([]);
  }

  async function addCustomizedItem() {
    if (!customizingItem) return;

    const quantity = parseInt(qty, 10);
    if (!quantity || quantity <= 0) return alert("Quantity must be positive");

    // try {
    //   const stockResult = await checkStock(customizingItem.id, quantity);
    //   if (!stockResult.ok) {
    //     return alert(
    //       `Not enough stock for ${stockResult.ingredient}\n` +
    //         `Needed: ${stockResult.needed}, Available: ${stockResult.available}`
    //     );
    //   }

    //   for (let t of selectedToppings) {
    //     const res = await checkStock(t.id, quantity);
    //     if (!res.ok) {
    //       return alert(
    //         `Not enough stock for ${res.ingredient}\n` +
    //           `Needed: ${res.needed}, Available: ${res.available}`
    //       );
    //     }
    //   }
    // } catch (err) {
    //   return alert("Error checking stock: " + err.message);
    // }

    const baseSubtotal = roundDown(customizingItem.price * quantity);
    const toppingsSubtotal = roundDown(
      selectedToppings.reduce((sum, t) => sum + t.price * quantity, 0)
    );
    const subtotal = roundDown(baseSubtotal + toppingsSubtotal);

    setOrderItems((prev) => [
      ...prev,
      {
        itemId: customizingItem.id,
        name: customizingItem.name,
        qty: quantity,
        subtotal,
        iceLevel,
        sugarLevel,
        toppings: selectedToppings.map((t) => t.name),
      },
    ]);

    setCustomizingItem(null);
  }

  function removeItem(index) {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  }

  function clearOrder() {
    setOrderItems([]);
  }

  const subtotal = roundDown(orderItems.reduce((sum, it) => sum + it.subtotal, 0));
  const tax = roundDown(subtotal * SALES_TAX_RATE);
  const total = roundDown(subtotal + tax);

  async function handleSubmit() {
    if (!employeeId) return alert("Enter employee ID");
    if (orderItems.length === 0) return alert("No items in order");

    try {
      // Flatten drinks + toppings
      const flattenedItems = orderItems.flatMap((i) => {
        const drinkItem = { item_id: i.itemId, quantity: i.qty };

        const toppingItems =
          i.toppings?.map((tName) => {
            // find topping by name in menu
            const topping = menu.find((m) => m.name === tName);
            if (!topping) return null;
            return { item_id: topping.id, quantity: i.qty };
          }).filter(Boolean) || [];

        return [drinkItem, ...toppingItems];
      });

      const result = await submitOrder({
        employee_id: employeeId, // backend expects snake_case
        items: flattenedItems,
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
      alert("Error submitting order: " + err.message);
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
                onClick={() => customizeDrink(d)}
              >
                {i + 1} - {d.name} {d.category ? `(${d.category})` : ""}
                <div>${d.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column (Cart + Totals) */}
      <div className="w-1/3 border rounded p-4 flex flex-col">
        <h2 className="font-bold mb-2">Cart</h2>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm">
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
                  <td>
                    {item.name} <br />
                    <span className="text-xs italic">
                      Ice: {item.iceLevel}, Sugar: {item.sugarLevel}
                      {item.toppings.length > 0 && `, Toppings: ${item.toppings.join(", ")}`}
                    </span>
                  </td>
                  <td>{item.qty}</td>
                  <td>${item.subtotal.toFixed(2)}</td>
                  <td>
                    <button className="text-red-600" onClick={() => removeItem(i)}>
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
            <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={clearOrder}>
              Clear
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded" onClick={onBack}>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-xl w-2/3 max-w-2xl">
            <h2 className="font-bold mb-4 text-lg">{customizingItem.name}</h2>

            {/* Ice Level */}
            <div className="mb-4">
              <div className="font-semibold mb-1">Ice Level:</div>
              <div className="flex gap-2 flex-wrap">
                {["None", "Light", "Regular", "Extra"].map((level) => (
                  <button
                    key={level}
                    className={`px-3 py-1 rounded border ${
                      iceLevel === level ? "bg-green-500 text-white" : "bg-gray-100"
                    }`}
                    onClick={() => setIceLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar Level */}
            <div className="mb-4">
              <div className="font-semibold mb-1">Sugar Level:</div>
              <div className="flex gap-2 flex-wrap">
                {["0%", "25%", "50%", "75%", "100%"].map((level) => (
                  <button
                    key={level}
                    className={`px-3 py-1 rounded border ${
                      sugarLevel === level ? "bg-yellow-500 text-white" : "bg-gray-100"
                    }`}
                    onClick={() => setSugarLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Toppings */}
            <div className="mb-4">
              <div className="font-semibold mb-1">Toppings:</div>
              <div className="flex gap-2 flex-wrap">
                {toppings.map((t) => (
                  <button
                    key={t.id}
                    className={`px-3 py-1 rounded border ${
                      selectedToppings.includes(t)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100"
                    }`}
                    onClick={() =>
                      selectedToppings.includes(t)
                        ? setSelectedToppings((prev) => prev.filter((x) => x.id !== t.id))
                        : setSelectedToppings((prev) => [...prev, t])
                    }
                  >
                    {t.name} (${t.price.toFixed(2)})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={addCustomizedItem}
              >
                Add to Cart
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setCustomizingItem(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
