export async function fetchMenu() {
  const res = await fetch("/api/menu");
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
