import { apiFetch } from "./api";

export async function searchFlightsApi({
  source,
  destination,
  date,
  passengers = 1,
  returnDate,
}) {
  const params = new URLSearchParams({
    source: String(source || "").trim(),
    destination: String(destination || "").trim(),
    date: String(date || "").trim(),
    passengers: String(passengers || 1),
  });

  // Add returnDate if provided for round-trip
  if (returnDate) {
    params.append("returnDate", String(returnDate).trim());
  }

  const res = await apiFetch(`/flights/search?${params.toString()}`, {
    method: "GET",
    auth: true,
  });
  return res.data; // { flights, returnFlights }
}
