import { useEffect, useCallback, useRef } from "react";
import {
  initializeSocket,
  joinFlightRoom,
  leaveFlightRoom,
  subscribeSeatEvents,
  unsubscribeSeatEvents,
  disconnectSocket,
} from "../lib/socket";

/**
 * Custom hook for real-time seat updates via Socket.IO
 * @param {string} flightId - Flight ID
 * @param {Object} handlers - Event handlers
 * @returns {Object} Socket connection state
 */
export const useSeatSocket = (flightId, handlers) => {
  const handlersRef = useRef(handlers);
  const isConnectedRef = useRef(false);

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Initialize socket and join flight room
  useEffect(() => {
    if (!flightId) return;

    let mounted = true;

    const setupSocket = async () => {
      try {
        // Initialize socket connection
        await initializeSocket();

        if (!mounted) return;

        // Join flight room
        await joinFlightRoom(flightId);

        if (!mounted) return;

        // Subscribe to seat events
        subscribeSeatEvents({
          onSeatLocked: (data) => {
            if (mounted && handlersRef.current.onSeatLocked) {
              handlersRef.current.onSeatLocked(data);
            }
          },
          onSeatUnlocked: (data) => {
            if (mounted && handlersRef.current.onSeatUnlocked) {
              handlersRef.current.onSeatUnlocked(data);
            }
          },
          onSeatBooked: (data) => {
            if (mounted && handlersRef.current.onSeatBooked) {
              handlersRef.current.onSeatBooked(data);
            }
          },
          onSeatExpired: (data) => {
            if (mounted && handlersRef.current.onSeatExpired) {
              handlersRef.current.onSeatExpired(data);
            }
          },
          onSeatCancelled: (data) => {
            if (mounted && handlersRef.current.onSeatCancelled) {
              handlersRef.current.onSeatCancelled(data);
            }
          },
          onSeatStatus: (data) => {
            if (mounted && handlersRef.current.onSeatStatus) {
              handlersRef.current.onSeatStatus(data);
            }
          },
        });

        isConnectedRef.current = true;
        console.log("Seat socket setup complete");
      } catch (error) {
        console.error("Failed to setup seat socket:", error);
        if (mounted && handlersRef.current.onError) {
          handlersRef.current.onError(error);
        }
      }
    };

    setupSocket();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (isConnectedRef.current) {
        unsubscribeSeatEvents();
        leaveFlightRoom(flightId);
        isConnectedRef.current = false;
      }
    };
  }, [flightId]);

  return {
    isConnected: isConnectedRef.current,
  };
};
