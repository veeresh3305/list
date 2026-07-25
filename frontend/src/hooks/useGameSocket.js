import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';

// One shared socket connection reused by every game in the app, instead of
// each game file opening its own connection (which is what the older games do).
let sharedSocket = null;
export function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, { autoConnect: false });
  }
  return sharedSocket;
}

/**
 * Connects to the shared socket and wires up a map of { eventName: handler }.
 * Handlers can safely be inline arrow functions - the hook always calls the
 * latest version via a ref, so you don't need to worry about stale closures.
 *
 * Usage:
 *   const socket = useGameSocket({
 *     player_joined: (data) => setPlayers(data.players),
 *     game_over: (data) => setWinner(data.winner),
 *   });
 *   socket.emit('join_room', { roomId, username });
 */
export function useGameSocket(events = {}) {
  const socket = getSocket();
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const eventNames = Object.keys(eventsRef.current);
    const handlers = {};

    eventNames.forEach((eventName) => {
      const handler = (...args) => eventsRef.current[eventName]?.(...args);
      handlers[eventName] = handler;
      socket.on(eventName, handler);
    });

    return () => {
      eventNames.forEach((eventName) => socket.off(eventName, handlers[eventName]));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  return socket;
}