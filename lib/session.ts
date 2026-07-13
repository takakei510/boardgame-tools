const PLAYER_ID_KEY = "wordocchiPlayerId";
const ROOM_CODE_KEY = "wordocchiRoomCode";

export const savePlayerSession = (
  playerId: string,
  roomCode: string,
) => {
  sessionStorage.setItem(PLAYER_ID_KEY, playerId);
  sessionStorage.setItem(ROOM_CODE_KEY, roomCode);
};

export const getPlayerId = () => {
  return sessionStorage.getItem(PLAYER_ID_KEY);
};

export const getRoomCode = () => {
  return sessionStorage.getItem(ROOM_CODE_KEY);
};

export const clearPlayerSession = () => {
  sessionStorage.removeItem(PLAYER_ID_KEY);
  sessionStorage.removeItem(ROOM_CODE_KEY);
};