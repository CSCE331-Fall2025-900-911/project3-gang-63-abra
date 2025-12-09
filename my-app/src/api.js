// Prefer the Vite-style env var and fall back to the deployed backend
const rawBase = import.meta.env.VITE_API_URL || "https://abra-backend.vercel.app/api";
const API_BASE = rawBase.trim().replace(/\/$/, "");

const buildUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

export async function fetchMenu() {
  const res = await fetch(buildUrl("/menu"));

  if (!res.ok) throw new Error("Failed to load menu");

  const data = await res.json();
  return Array.isArray(data)
    ? data.map((it) => ({
        id: it.id ?? it.item_id ?? it.uuid,
        name: it.name ?? it.title ?? "Item",
        price: Number(it.price ?? it.cost ?? 0),
        category: it.category ?? it.type ?? null,
        description: it.description ?? null,
        isTopping: Boolean(it.is_topping ?? it.isTopping ?? false),
      }))
    : [];
}

// ==================== ORDER HISTORY API ====================

export async function fetchOrders(startDate = null, endDate = null) {
  let url = buildUrl("/orders");
  if (startDate && endDate) {
    url += `?start_date=${startDate}&end_date=${endDate}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json();
}

export async function fetchOrderItems(orderId) {
  const res = await fetch(buildUrl(`/orders/${orderId}/items`));
  if (!res.ok) throw new Error("Failed to load order items");
  return res.json();
}

export async function fetchOrderTrends(startDate, endDate) {
  const res = await fetch(buildUrl(`/orders/trends?start_date=${startDate}&end_date=${endDate}`));
  if (!res.ok) throw new Error("Failed to load order trends");
  return res.json();
}

// ==================== INVENTORY API ====================

export async function fetchInventory() {
  const res = await fetch(buildUrl("/inventory"));
  if (!res.ok) throw new Error("Failed to load inventory");
  return res.json();
}

export async function fetchLowStock(threshold = 10) {
  const res = await fetch(buildUrl(`/inventory/low-stock?threshold=${threshold}`));
  if (!res.ok) throw new Error("Failed to load low stock items");
  return res.json();
}

export async function restockInventory(items) {
  const res = await fetch(buildUrl("/inventory/restock"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error("Failed to restock inventory");
  return res.json();
}

export async function updateInventoryItem(ingredientId, stock) {
  const res = await fetch(buildUrl(`/inventory/${ingredientId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock }),
  });
  if (!res.ok) throw new Error("Failed to update inventory item");
  return res.json();
}

export async function addInventoryItem(name, stock = 0) {
  const res = await fetch(buildUrl("/inventory"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, stock }),
  });
  if (!res.ok) throw new Error("Failed to add inventory item");
  return res.json();
}

export async function deleteInventoryItem(ingredientId) {
  const res = await fetch(buildUrl(`/inventory/${ingredientId}`), {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete inventory item");
  return res.json();
}

// ==================== EMPLOYEE API ====================

export async function fetchEmployees() {
  const res = await fetch(buildUrl("/employees"));
  if (!res.ok) throw new Error("Failed to load employees");
  return res.json();
}

export async function fetchEmployee(employeeId) {
  const res = await fetch(buildUrl(`/employees/${employeeId}`));
  if (!res.ok) throw new Error("Failed to load employee");
  return res.json();
}

export async function addEmployee(name, salary = null, managerId = 0) {
  const res = await fetch(buildUrl("/employees"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, salary, manager_id: managerId }),
  });
  if (!res.ok) throw new Error("Failed to add employee");
  return res.json();
}

export async function updateEmployee(employeeId, data) {
  const res = await fetch(buildUrl(`/employees/${employeeId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update employee");
  return res.json();
}

export async function deleteEmployee(employeeId) {
  const res = await fetch(buildUrl(`/employees/${employeeId}`), {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete employee");
  return res.json();
}

export async function fetchEmployeePerformance(employeeId, startDate = null, endDate = null) {
  let url = buildUrl(`/employees/${employeeId}/performance`);
  if (startDate && endDate) {
    url += `?start_date=${startDate}&end_date=${endDate}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load employee performance");
  return res.json();
}

// ==================== MENU MANAGEMENT API ====================

export async function addMenuItem(name, price, isTopping = false) {
  const res = await fetch(buildUrl("/menu"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price, is_topping: isTopping }),
  });
  if (!res.ok) throw new Error("Failed to add menu item");
  return res.json();
}

export async function updateMenuItem(itemId, data) {
  const res = await fetch(buildUrl(`/menu/${itemId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update menu item");
  return res.json();
}

export async function deleteMenuItem(itemId) {
  const res = await fetch(buildUrl(`/menu/${itemId}`), {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete menu item");
  return res.json();
}

export async function checkStock(itemId, qty) {
  const res = await fetch(buildUrl(`/check-stock`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, qty })
  });

  if (!res.ok) throw new Error("Stock check failed");
  return await res.json();  // { ok: true } OR { ok: false, ingredient: "...", needed: X, available: Y }
}

export async function submitOrder(order) {
  const res = await fetch(buildUrl(`/order`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order)
  });

  if (!res.ok) throw new Error("Failed to submit order");
  return await res.json(); // { orderId, subtotal, tax, total }
}
