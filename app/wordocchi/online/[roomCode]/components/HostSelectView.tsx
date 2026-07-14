type HostSelectViewProps = {
  roomCode: string;
  topicText: string;
  currentWord: string;
  submissionWord: string | null;
  submissionPlayerName: string | null;
  isHost: boolean;
  errorMessage: string;
  isResolvingSelection: boolean;
  onChooseCurrentWord: () => void;
  onChooseSubmission: () => void;
};

export default function HostSelectView({
  roomCode,
  topicText,
  currentWord,
  submissionWord,
  submissionPlayerName,
  isHost,
  errorMessage,
  isResolvingSelection,
  onChooseCurrentWord,
  onChooseSubmission,
}: HostSelectViewProps) {
  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-600">オンラインプレイ</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">親の判定</h1>

          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <p className="text-sm font-semibold text-orange-700">部屋番号</p>
            <p className="mt-1 text-2xl font-bold tracking-[0.4em] text-gray-900">
              {roomCode}
            </p>
            <p className="mt-4 text-sm font-semibold text-orange-700">お題</p>
            {isHost ? (
              <p className="mt-2 text-2xl font-bold text-gray-900">{topicText}</p>
            ) : (
              <p className="mt-2 text-2xl font-bold text-gray-900">
                お題は親だけに表示されています
              </p>
            )}
            <p className="mt-4 text-sm font-semibold text-orange-700">現在のワード</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{currentWord}</p>
          </div>

          {errorMessage && (
            <p className="mt-4 text-center font-semibold text-red-600">
              {errorMessage}
            </p>
          )}

          {isHost ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <button
                type="button"
                onClick={onChooseCurrentWord}
                disabled={isResolvingSelection}
                className="rounded-3xl border-2 border-orange-300 bg-white px-6 py-8 text-left shadow-sm transition hover:border-orange-500 hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-300"
              >
                <p className="text-sm font-bold text-gray-500">このまま続ける</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{currentWord}</p>
              </button>

              <button
                type="button"
                onClick={onChooseSubmission}
                disabled={isResolvingSelection || !submissionWord}
                className="rounded-3xl border-2 border-orange-500 bg-orange-50 px-6 py-8 text-left shadow-sm transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-50"
              >
                <p className="text-sm font-bold text-orange-700">
                  {submissionPlayerName ?? "子プレイヤー"}さんの回答を採用
                </p>
                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {submissionWord ?? "回答がまだありません"}
                </p>
              </button>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-orange-100 px-6 py-10 text-center">
              <p className="text-lg font-bold text-orange-800">
                親が判定しています
              </p>
              <p className="mt-3 text-sm font-semibold text-orange-700">
                {submissionPlayerName
                  ? `${submissionPlayerName}さんの回答が表示されています`
                  : "回答を確認しています"}
              </p>
              {submissionWord && (
                <p className="mt-4 text-3xl font-bold text-gray-900">
                  {submissionWord}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
