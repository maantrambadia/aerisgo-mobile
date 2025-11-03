import { apiFetch } from "./api";

/**
 * Check if booking is eligible for check-in
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Eligibility response
 */
export async function checkEligibility(bookingId) {
  const response = await apiFetch(`/check-in/${bookingId}/eligibility`, {
    method: "GET",
    auth: true,
  });
  return response.data;
}

/**
 * Perform check-in for a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Check-in response with boarding pass
 */
export async function performCheckIn(bookingId) {
  const response = await apiFetch(`/check-in/${bookingId}`, {
    method: "POST",
    auth: true,
  });
  return response.data;
}

/**
 * Get boarding pass for checked-in booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Boarding pass data
 */
export async function getBoardingPass(bookingId) {
  const response = await apiFetch(`/check-in/${bookingId}/boarding-pass`, {
    method: "GET",
    auth: true,
  });
  return response.data;
}
