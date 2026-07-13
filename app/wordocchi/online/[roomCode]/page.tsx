import WaitingRoomClient from "./WaitingRoomClient";

type WaitingRoomPageProps = {
  params: Promise<{
    roomCode: string;
  }>;
};

export default async function WaitingRoomPage({
  params,
}: WaitingRoomPageProps) {
  const { roomCode } = await params;

  return <WaitingRoomClient roomCode={roomCode.toUpperCase()} />;
}