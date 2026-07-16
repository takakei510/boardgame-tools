type FinalAnswerViewProps = {
  roomCode: string;
  topicText: string;
  finalWord: string;
  isHost: boolean;
  answerDraft: string;
  hasSubmitted: boolean;
  submittedCount: number;
  totalPlayers: number;
  isSubmitting: boolean;
  errorMessage: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
};

export default function FinalAnswerView({
  roomCode,
  topicText,
  finalWord,
  isHost,
  answerDraft,
  hasSubmitted,
  submittedCount,
  totalPlayers,
  isSubmitting,
  errorMessage,
  onAnswerChange,
  onSubmit,
}: FinalAnswerViewProps) {
  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-bold text-orange-600">オンラインプレイ</p>

        <h1 className="mt-2 text-3xl font-black text-gray-900">
          最終回答タイム
        </h1>

        <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <p className="text-sm font-bold text-orange-600">部屋番号</p>
          <p className="mt-1 text-2xl font-black tracking-[0.3em] text-gray-900">
            {roomCode}
          </p>

          {isHost && (
            <>
              <p className="mt-6 text-sm font-bold text-orange-600">
                今回のお題
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {topicText}
              </p>
            </>
          )}

          <p className="mt-6 text-sm font-bold text-orange-600">最終ワード</p>
          <p className="mt-1 text-3xl font-black text-gray-900">{finalWord}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <p className="font-bold leading-relaxed text-gray-900">
            最終ワードから、お題を予想し、
            <br />
            そのお題に対する答えを入力してください。
          </p>

          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            ※これまでに出た回答や、
            <br />
            最終ワードをそのまま言い換えた回答は避けてください。
          </p>
        </div>

        {isHost ? (
          <div className="mt-8 rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-lg font-bold text-gray-900">
              子プレイヤーの最終回答を待っています
            </p>

            <p className="mt-3 text-2xl font-black text-orange-600">
              {submittedCount} / {totalPlayers}
            </p>
          </div>
        ) : hasSubmitted ? (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-lg font-bold text-green-800">
              最終回答を送信しました
            </p>

            <p className="mt-2 text-sm text-green-700">
              他のプレイヤーの回答を待っています。
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <label
              htmlFor="final-answer"
              className="text-sm font-bold text-gray-700"
            >
              あなたの最終回答
            </label>

            <input
              id="final-answer"
              type="text"
              maxLength={50}
              value={answerDraft}
              onChange={(event) => onAnswerChange(event.target.value)}
              placeholder="お題に合う答えを入力"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-2xl border-2 border-gray-200 px-5 py-4 text-lg font-bold text-gray-900 outline-none transition focus:border-orange-400 disabled:bg-gray-100"
            />

            <div className="mt-2 text-right text-sm text-gray-500">
              {answerDraft.length} / 50
            </div>

            <button
              type="button"
              onClick={onSubmit}
              disabled={
                isSubmitting ||
                answerDraft.trim().length < 1 ||
                answerDraft.trim().length > 50
              }
              className="mt-4 w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? "送信中..." : "最終回答を送信"}
            </button>
          </div>
        )}

        {errorMessage && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    </main>
  );
}
