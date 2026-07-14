type TopicResultEntry = {
  roundNumber: number;
  playerName: string;
  word: string;
  selected: boolean;
};

type TopicResultViewProps = {
  roomCode: string;
  topicText: string;
  initialWord: string;
  finalWord: string;
  entries: TopicResultEntry[];
  isHost: boolean;
  isProceeding: boolean;
  errorMessage: string;
  onNextTopic: () => void;
  onFinishGame: () => void;
};

export default function TopicResultView({
  roomCode,
  topicText,
  initialWord,
  finalWord,
  entries,
  isHost,
  isProceeding,
  errorMessage,
  onNextTopic,
  onFinishGame,
}: TopicResultViewProps) {
  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-600">オンラインプレイ</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">答え合わせ</h1>

          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <p className="text-sm font-semibold text-orange-700">部屋番号</p>
            <p className="mt-1 text-2xl font-bold tracking-[0.4em] text-gray-900">
              {roomCode}
            </p>
            <p className="mt-4 text-sm font-semibold text-orange-700">今回のお題</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{topicText}</p>
            <p className="mt-4 text-sm font-semibold text-orange-700">最初のワード</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{initialWord}</p>
            <p className="mt-4 text-sm font-semibold text-orange-700">最終ワード</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{finalWord}</p>
          </div>

          {errorMessage && (
            <p className="mt-4 text-center font-semibold text-red-600">
              {errorMessage}
            </p>
          )}

          <div className="mt-8 space-y-3">
            <h2 className="text-xl font-bold text-gray-900">回答の流れ</h2>

            {entries.map((entry) => (
              <div
                key={`${entry.roundNumber}-${entry.playerName}-${entry.word}`}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
              >
                <p className="text-sm font-bold text-gray-500">
                  {entry.roundNumber}. {entry.playerName}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{entry.word}</p>
                <p className="mt-2 text-sm font-bold text-orange-700">
                  {entry.selected ? "採用" : "不採用"}
                </p>
              </div>
            ))}
          </div>

          {isHost ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={onNextTopic}
                disabled={isProceeding}
                className="rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                次のお題へ
              </button>

              <button
                type="button"
                onClick={onFinishGame}
                disabled={isProceeding}
                className="rounded-2xl border-2 border-orange-500 px-6 py-4 text-lg font-bold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
              >
                ゲームを終了する
              </button>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-orange-100 px-6 py-10 text-center text-lg font-bold text-orange-800">
              親が次の操作を選んでいます
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
