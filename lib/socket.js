import { io } from "socket.io-client";
import { API_BASE } from "./api";
import { getToken } from "./storage";

let socket = null;

/**
 * Initialize Socket.IO connection
 * @returns {Promise<Socket>} Socket instance
 */
export const initializeSocket = async () => {
  if (socket?.connected) {
    return socket;
  }

  const token = await getToken();
  if (!token) {
    throw new Error("Authentication token required");
  }

  socket = io(API_BASE, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("Socket.IO connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket.IO disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error.message);
  });

  socket.on("error", (error) => {
    console.error("Socket.IO error:", error);
  });

  return socket;
};

/**
 * Get existing socket instance
 * @returns {Socket|null}
 */
export const getSocket = () => socket;

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a flight room to receive real-time seat updates
 * @param {string} flightId - Flight ID
 * @returns {Promise<void>}
 */
export const joinFlightRoom = async (flightId) => {
  const sock = await initializeSocket();
  return new Promise((resolve, reject) => {
    sock.emit("join-flight", { flightId }, (response) => {
      if (response?.error) {
        reject(new Error(response.error));
      } else {
        console.log(`Joined flight room: ${flightId}`);
        resolve();
      }
    });
  });
};

/**
 * Leave a flight room
 * @param {string} flightId - Flight ID
 */
export const leaveFlightRoom = (flightId) => {
  if (socket?.connected) {
    socket.emit("leave-flight", { flightId });
    console.log(`Left flight room: ${flightId}`);
  }
};

/**
 * Subscribe to seat events
 * @param {Object} handlers - Event handlers
 * @param {Function} handlers.onSeatLocked - Called when a seat is locked
 * @param {Function} handlers.onSeatUnlocked - Called when a seat is unlocked
 * @param {Function} handlers.onSeatBooked - Called when a seat is booked
 * @param {Function} handlers.onSeatExpired - Called when a lock expires
 * @param {Function} handlers.onSeatStatus - Called with initial seat status
 */
export const subscribeSeatEvents = (handlers) => {
  if (!socket) return;

  if (handlers.onSeatLocked) {
    socket.on("seat-locked", handlers.onSeatLocked);
  }
  if (handlers.onSeatUnlocked) {
    socket.on("seat-unlocked", handlers.onSeatUnlocked);
  }
  if (handlers.onSeatBooked) {
    socket.on("seat-booked", handlers.onSeatBooked);
  }
  if (handlers.onSeatExpired) {
    socket.on("seat-expired", handlers.onSeatExpired);
  }
  if (handlers.onSeatStatus) {
    socket.on("seat-status", handlers.onSeatStatus);
  }
};

/**
 * Unsubscribe from seat events
 */
export const unsubscribeSeatEvents = () => {
  if (!socket) return;

  socket.off("seat-locked");
  socket.off("seat-unlocked");
  socket.off("seat-booked");
  socket.off("seat-expired");
  socket.off("seat-status");
};
