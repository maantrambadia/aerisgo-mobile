import { apiFetch } from "./api";

export async function searchFlightsApi({
  source,
  destination,
  date,
  passengers = 1,
}) {
  const params = new URLSearchParams({
    source: String(source || "").trim(),
    destination: String(destination || "").trim(),
    date: String(date || "").trim(),
    passengers: String(passengers || 1),
  });
  const res = await apiFetch(`/flights/search?${params.toString()}`, {
    method: "GET",
    auth: false,
  });
  return res.data; // { flights }
}
