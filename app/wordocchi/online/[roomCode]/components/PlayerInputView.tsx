type PlayerInputViewProps = {
  roomCode: string;
  topicText: string;
  currentWord: string;
  currentPlayerName: string;
  isHost: boolean;
  isCurrentPlayer: boolean;
  answerDraft: string;
  isSubmitting: boolean;
  errorMessage: string;
  onChangeAnswer: (value: string) => void;
  onSubmitAnswer: () => void;
};

export default function PlayerInputView({
  roomCode,
  topicText,
  currentWord,
  currentPlayerName,
  isHost,
  isCurrentPlayer,
  answerDraft,
  isSubmitting,
  errorMessage,
  onChangeAnswer,
  onSubmitAnswer,
}: PlayerInputViewProps) {
  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-600">オンラインプレイ</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">回答入力</h1>

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

          {isCurrentPlayer ? (
            <div className="mt-8 rounded-3xl border border-orange-200 bg-white p-6 shadow-sm">
              <p className="text-lg font-bold text-gray-900">
                あなたの回答ターンです
              </p>

              <label className="mt-5 block">
                <span className="text-sm font-bold text-gray-700">回答</span>
                <textarea
                  value={answerDraft}
                  onChange={(event) => onChangeAnswer(event.target.value)}
                  maxLength={50}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-orange-500"
                  placeholder="1〜50文字で入力"
                />
              </label>

              <button
                type="button"
                onClick={onSubmitAnswer}
                disabled={isSubmitting}
                className="mt-4 w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isSubmitting ? "送信中..." : "回答を送信する"}
              </button>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-orange-100 px-6 py-10 text-center">
              <p className="text-lg font-bold text-orange-800">
                {currentPlayerName}さんの回答を待っています
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
