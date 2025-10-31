import { apiFetch } from "./api";

/**
 * Get seats for a flight
 * @param {string} flightId - Flight ID
 * @returns {Promise<Object>} Seats data
 */
export const getFlightSeats = async (flightId) => {
  const { data } = await apiFetch(`/seats/flight/${flightId}`, {
    method: "GET",
    auth: false,
  });
  return data;
};

/**
 * Lock a seat temporarily
 * @param {Object} params - Lock parameters
 * @param {string} params.flightId - Flight ID
 * @param {string} params.seatNumber - Seat number
 * @param {string} params.sessionId - Unique session ID
 * @param {string} [params.previousSeat] - Previous seat to unlock
 * @returns {Promise<Object>} Lock response
 */
export const lockSeat = async ({
  flightId,
  seatNumber,
  sessionId,
  previousSeat,
}) => {
  const { data } = await apiFetch("/seats/lock", {
    method: "POST",
    json: { flightId, seatNumber, sessionId, previousSeat },
    auth: true,
  });
  return data;
};

/**
 * Unlock a seat
 * @param {Object} params - Unlock parameters
 * @param {string} params.flightId - Flight ID
 * @param {string} params.seatNumber - Seat number
 * @param {string} params.sessionId - Session ID
 * @returns {Promise<Object>} Unlock response
 */
export const unlockSeat = async ({ flightId, seatNumber, sessionId }) => {
  const { data } = await apiFetch("/seats/unlock", {
    method: "POST",
    json: { flightId, seatNumber, sessionId },
    auth: true,
  });
  return data;
};
