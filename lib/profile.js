import { apiFetch } from "./api";

// Get user profile with documents
export async function getProfile() {
  const res = await apiFetch("/profile", {
    method: "GET",
    auth: true,
  });
  return res.data;
}

// Update user profile
export async function updateProfile({ name, phone, gender }) {
  const res = await apiFetch("/profile", {
    method: "PUT",
    auth: true,
    json: { name, phone, gender },
  });
  return res.data;
}

// Change password
export async function changePassword({ currentPassword, newPassword }) {
  const res = await apiFetch("/profile/change-password", {
    method: "POST",
    auth: true,
    json: { currentPassword, newPassword },
  });
  return res.data;
}

// Get user documents
export async function getDocuments() {
  const res = await apiFetch("/profile/documents", {
    method: "GET",
    auth: true,
  });
  return res.data;
}

// Add or update document
export async function upsertDocument({ documentType, documentNumber }) {
  const res = await apiFetch("/profile/documents", {
    method: "POST",
    auth: true,
    json: { documentType, documentNumber },
  });
  return res.data;
}

// Delete document
export async function deleteDocument(documentType) {
  const res = await apiFetch(`/profile/documents/${documentType}`, {
    method: "DELETE",
    auth: true,
  });
  return res.data;
}
