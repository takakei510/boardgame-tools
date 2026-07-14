import OnlineRoomClient from "./OnlineRoomClient";

type WaitingRoomPageProps = {
  params: Promise<{
    roomCode: string;
  }>;
};

export default async function WaitingRoomPage({
  params,
}: WaitingRoomPageProps) {
  const { roomCode } = await params;

  return <OnlineRoomClient roomCode={roomCode.toUpperCase()} />;
}