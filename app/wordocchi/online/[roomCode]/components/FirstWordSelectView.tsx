import type { FirstWordCandidate } from "@/lib/wordocchiGame";

type FirstWordSelectViewProps = {
  roomCode: string;
  topicText: string;
  candidates: FirstWordCandidate[];
  isHost: boolean;
  isSelecting: boolean;
  errorMessage: string;
  onSelectCandidate: (candidate: FirstWordCandidate) => void;
};

export default function FirstWordSelectView({
  roomCode,
  topicText,
  candidates,
  isHost,
  isSelecting,
  errorMessage,
  onSelectCandidate,
}: FirstWordSelectViewProps) {
  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-600">オンラインプレイ</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">最初のワード選択</h1>

          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <p className="text-sm font-semibold text-orange-700">部屋番号</p>
            <p className="mt-1 text-2xl font-bold tracking-[0.4em] text-gray-900">
              {roomCode}
            </p>
            <p className="mt-4 text-sm font-semibold text-orange-700">お題</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{topicText}</p>
          </div>

          {errorMessage && (
            <p className="mt-4 text-center font-semibold text-red-600">
              {errorMessage}
            </p>
          )}

          {isHost ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => onSelectCandidate(candidate)}
                  disabled={isSelecting}
                  className="rounded-2xl border-2 border-orange-500 bg-white px-4 py-6 text-lg font-bold text-gray-900 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                >
                  {candidate.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-orange-100 px-6 py-10 text-center text-lg font-bold text-orange-800">
              親が最初のワードを選んでいます
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
