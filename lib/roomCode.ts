const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 4;

export function generateRoomCode(): string {
  let roomCode = "";

  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(
      Math.random() * ROOM_CODE_CHARACTERS.length
    );

    roomCode += ROOM_CODE_CHARACTERS[randomIndex];
  }

  return roomCode;
}