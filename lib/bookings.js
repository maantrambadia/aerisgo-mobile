import { apiFetch } from "./api";

export async function getMyBookings({
  status = "",
  page = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  params.append("page", String(page));
  params.append("limit", String(limit));

  const { data } = await apiFetch(`/bookings?${params.toString()}`, {
    method: "GET",
    auth: true,
  });
  return data;
}

export async function cancelBooking(bookingId) {
  const { data } = await apiFetch(`/bookings/${bookingId}/cancel`, {
    method: "POST",
    auth: true,
  });
  return data;
}

export async function getBookingPriceBreakdown(bookingId) {
  const { data } = await apiFetch(`/bookings/${bookingId}/price-breakdown`, {
    method: "GET",
    auth: true,
  });
  return data;
}

export async function getBookingDetails(bookingId) {
  const { data } = await apiFetch(`/bookings/${bookingId}`, {
    method: "GET",
    auth: true,
  });
  return data;
}
