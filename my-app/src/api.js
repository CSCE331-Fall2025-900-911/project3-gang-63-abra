const DEFAULT_API_BASE = "https://backend-hazel-nine-20.vercel.app/api";

const API_BASE =
  (import.meta?.env?.VITE_API_URL && import.meta.env.VITE_API_URL.trim().replace(/\/$/, "")) ||
  DEFAULT_API_BASE;

const buildUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

export async function fetchMenu() {
  const res = await fetch(buildUrl("/menu"));

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

/* New API functions */
export async function fetchEmployees() {
  const res = await fetch(buildUrl("/employees"));
  if (!res.ok) throw new Error("Failed to load employees");
  return await res.json();
}

export async function addEmployee(employee) {
  const res = await fetch(buildUrl("/employees"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employee),
  });

  if (!res.ok) throw new Error("Failed to add employee");
  return await res.json();
}

export async function deleteEmployee(id) {
  const res = await fetch(buildUrl(`/employees/${id}`), {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete employee");
  return true;
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
