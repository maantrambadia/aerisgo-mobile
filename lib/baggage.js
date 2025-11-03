import { apiFetch } from "./api";

/**
 * Get baggage allowance for a travel class
 * @param {string} travelClass - Travel class (economy, business, first)
 * @returns {Promise} Baggage allowance
 */
export async function getBaggageAllowance(travelClass) {
  const response = await apiFetch(
    `/baggage/allowance?travelClass=${travelClass}`,
    {
      method: "GET",
      auth: true,
    }
  );
  return response.data;
}

/**
 * Get baggage allowance for a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Baggage information
 */
export async function getBaggageByBooking(bookingId) {
  const response = await apiFetch(`/baggage/booking/${bookingId}`, {
    method: "GET",
    auth: true,
  });
  return response.data;
}

/**
 * Get baggage summary
 * @param {string} travelClass - Travel class (economy, business, first)
 * @returns {Promise} Baggage summary
 */
export async function getBaggageSummary(travelClass) {
  const response = await apiFetch(
    `/baggage/summary?travelClass=${travelClass}`,
    {
      method: "GET",
      auth: true,
    }
  );
  return response.data;
}

/**
 * Compare baggage allowances across all classes
 * @returns {Promise} Comparison data
 */
export async function compareBaggageAllowances() {
  const response = await apiFetch("/baggage/compare", {
    method: "GET",
    auth: true,
  });
  return response.data;
}
