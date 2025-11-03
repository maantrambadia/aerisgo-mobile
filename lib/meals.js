import { apiFetch } from "./api";

/**
 * Get available meals for a travel class
 * @param {string} travelClass - Travel class (economy, business, first)
 * @returns {Promise} Available meals
 */
export async function getAvailableMeals(travelClass) {
  const response = await apiFetch(
    `/meals/available?travelClass=${travelClass}`,
    {
      method: "GET",
      auth: true,
    }
  );
  return response.data;
}

/**
 * Get meal preferences for a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Meal preferences
 */
export async function getMealPreferences(bookingId) {
  const response = await apiFetch(`/meals/${bookingId}`, {
    method: "GET",
    auth: true,
  });
  return response.data;
}

/**
 * Update meal preferences for a booking
 * @param {string} bookingId - Booking ID
 * @param {object} data - Meal preferences data
 * @returns {Promise} Update response
 */
export async function updateMealPreference(bookingId, data) {
  const response = await apiFetch(`/meals/${bookingId}`, {
    method: "PUT",
    auth: true,
    json: data,
  });
  return response.data;
}
