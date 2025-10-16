import { apiFetch } from "./api";

/**
 * Get all airports
 */
export const getAllAirports = async () => {
  const response = await apiFetch("/airports");
  return response.data?.data || [];
};

/**
 * Get popular airports (for quick selection)
 */
export const getPopularAirports = async () => {
  const response = await apiFetch("/airports/popular");
  return response.data?.data || [];
};

/**
 * Search airports by query (code, city, name, state)
 */
export const searchAirports = async (query) => {
  if (!query || query.trim() === "") {
    return await getAllAirports();
  }
  const response = await apiFetch(
    `/airports/search?q=${encodeURIComponent(query)}`
  );
  return response.data?.data || [];
};

/**
 * Get airport by code
 */
export const getAirportByCode = async (code) => {
  const response = await apiFetch(`/airports/${code}`);
  return response.data?.data || null;
};

/**
 * Format airport for display
 * Returns: "City (CODE)"
 */
export const formatAirport = (airport) => {
  return `${airport.city} (${airport.code})`;
};

/**
 * Format airport for compact display
 * Returns: "City"
 */
export const formatAirportCity = (airport) => {
  return airport.city;
};

/**
 * Parse city string to get city name only
 * Handles both "City, India" and "City (CODE)" formats
 */
export const parseCityName = (cityString) => {
  if (!cityString) return "";

  // Remove ", India" if present
  let city = cityString.replace(", India", "");

  // Remove (CODE) if present
  city = city.replace(/\s*\([A-Z]{3}\)\s*/, "");

  return city.trim();
};
