const PLAYER_ID_KEY = "wordocchiPlayerId";
const ROOM_CODE_KEY = "wordocchiRoomCode";

const isBrowser = typeof window !== "undefined";

export const savePlayerSession = (
  playerId: string,
  roomCode: string,
) => {
  if (!isBrowser) {
    return;
  }

  sessionStorage.setItem(PLAYER_ID_KEY, playerId);
  sessionStorage.setItem(ROOM_CODE_KEY, roomCode);
};

export const getPlayerId = () => {
  if (!isBrowser) {
    return null;
  }

  return sessionStorage.getItem(PLAYER_ID_KEY);
};

export const getRoomCode = () => {
  if (!isBrowser) {
    return null;
  }

  return sessionStorage.getItem(ROOM_CODE_KEY);
};

export const clearPlayerSession = () => {
  if (!isBrowser) {
    return;
  }

  sessionStorage.removeItem(PLAYER_ID_KEY);
  sessionStorage.removeItem(ROOM_CODE_KEY);
};