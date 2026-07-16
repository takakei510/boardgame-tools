import type { PlayerRow } from "@/lib/wordocchiGame";

type WaitingRoomViewProps = {
  roomCode: string;
  players: PlayerRow[];
  isHost: boolean;
  canStart: boolean;
  isStarting: boolean;
  copied: boolean;
  errorMessage: string;
  answerCycles: number;
  onCopyRoomCode: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  isUpdatingCycles: boolean;
};

export default function WaitingRoomView({
  roomCode,
  players,
  isHost,
  canStart,
  isStarting,
  copied,
  errorMessage,
  answerCycles,
  onCopyRoomCode,
  onStartGame,
  onLeaveRoom,
  onIncrease,
  onDecrease,
  isUpdatingCycles,
}: WaitingRoomViewProps) {
  const maxPlayers = 8;

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-xl">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="text-sm font-semibold text-orange-700 hover:underline"
        >
          ← 部屋を退出する
        </button>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-600">オンラインプレイ</p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">待機ルーム</h1>

          <div className="mt-8 rounded-2xl bg-orange-100 p-6 text-center">
            <p className="text-sm font-semibold text-orange-700">部屋番号</p>

            <p className="mt-2 text-5xl font-bold tracking-[0.45em] text-gray-900">
              {roomCode}
            </p>

            <button
              type="button"
              onClick={onCopyRoomCode}
              className="mt-4 rounded-xl border-2 border-orange-500 px-5 py-2 font-bold text-orange-600 transition hover:bg-orange-50"
            >
              {copied ? "コピーしました！" : "部屋番号をコピー"}
            </button>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">参加者</h2>

              <span className="text-sm text-gray-500">
                {players.length}/{maxPlayers}人
              </span>
            </div>

            {errorMessage && (
              <p className="mt-4 text-center font-semibold text-red-600">
                {errorMessage}
              </p>
            )}

            <div className="mt-4 space-y-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <span className="flex items-center gap-3 font-semibold text-gray-800">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        player.connected ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    {player.name}
                  </span>

                  {player.is_host && (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
                      👑 親
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <p className="text-sm font-bold text-orange-700">
              通常回答の周回数
            </p>

            {isHost ? (
              <div className="mt-3 flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={onDecrease}
                  disabled={answerCycles <= 1 || isUpdatingCycles}
                  className="h-11 w-11 rounded-xl border-2 border-orange-300 text-xl font-bold text-orange-600 transition hover:bg-orange-100 disabled:cursor-default disabled:opacity-40"
                >
                  −
                </button>

                <p className="min-w-20 text-center text-2xl font-bold text-gray-900">
                  {answerCycles}周
                </p>

                <button
                  type="button"
                  onClick={onIncrease}
                  disabled={isUpdatingCycles}
                  className="h-11 w-11 rounded-xl border-2 border-orange-300 text-xl font-bold text-orange-600 transition hover:bg-orange-100 disabled:cursor-default disabled:opacity-40"
                >
                  ＋
                </button>
              </div>
            ) : (
              <p className="mt-3 text-center text-2xl font-bold text-gray-900">
                {answerCycles}周
              </p>
            )}

            <p className="mt-3 text-center text-sm text-gray-500">
              各プレイヤーが回答する回数です
            </p>
          </div>

          {isHost ? (
            <button
              type="button"
              onClick={onStartGame}
              disabled={!canStart || isStarting}
              className="mt-8 w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600 disabled:cursor-default disabled:bg-gray-300"
            >
              {isStarting ? "ゲームを開始中..." : "ゲームを開始する"}
            </button>
          ) : (
            <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 px-6 py-4 text-center text-sm font-semibold text-orange-700">
              親がゲームを開始するのを待っています。
            </div>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            {canStart
              ? isHost
                ? "全員が参加したらゲームを開始してください。"
                : "親がゲーム開始を待っています。"
              : "参加者が2人以上になると開始できます。"}
          </p>
        </section>
      </div>
    </main>
  );
}
