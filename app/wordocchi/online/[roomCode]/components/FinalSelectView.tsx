import type { SubmissionRow } from "@/lib/wordocchiGame";

type FinalSelectViewProps = {
  roomCode: string;
  topicText: string;
  initialWord: string;
  finalWord: string;
  finalSubmissions: SubmissionRow[];
  isHost: boolean;
  isSelecting: boolean;
  errorMessage: string;
  onSelect: (submission: SubmissionRow) => void;
};

export default function FinalSelectView({
  roomCode,
  topicText,
  initialWord,
  finalWord,
  finalSubmissions,
  isHost,
  isSelecting,
  errorMessage,
  onSelect,
}: FinalSelectViewProps) {
  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-bold text-orange-600">
          オンラインプレイ
        </p>

        <h1 className="mt-2 text-3xl font-black text-gray-900">
          最終回答選択タイム
        </h1>

        <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <p className="text-sm font-bold text-orange-600">
            部屋番号
          </p>
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

              <p className="mt-6 text-sm font-bold text-orange-600">
                最初のワード
              </p>
              <p className="mt-1 text-2xl font-black text-gray-900">
                {initialWord}
              </p>
            </>
          )}

          <p className="mt-6 text-sm font-bold text-orange-600">
            最終ワード
          </p>
          <p className="mt-1 text-3xl font-black text-gray-900">
            {finalWord}
          </p>
        </div>

        {isHost ? (
          <div className="mt-8">
            <p className="text-lg font-bold text-gray-900">
              最初のワードに最も近い回答を選んでください
            </p>

            <p className="mt-2 text-sm text-gray-500">
              回答者の名前は、選択が終わるまで表示されません。
            </p>

            <div className="mt-5 space-y-3">
              {finalSubmissions.map((submission, index) => (
                <button
                  key={submission.id}
                  type="button"
                  disabled={isSelecting}
                  onClick={() => onSelect(submission)}
                  className="w-full rounded-2xl border-2 border-gray-200 bg-white p-5 text-left transition hover:border-orange-400 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-sm font-bold text-gray-500">
                    最終回答 {index + 1}
                  </span>

                  <span className="mt-2 block text-xl font-black text-gray-900">
                    {submission.word}
                  </span>
                </button>
              ))}
            </div>

            {isSelecting && (
              <p className="mt-4 text-center font-bold text-orange-600">
                選択結果を保存しています...
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-lg font-bold text-gray-900">
              親プレイヤーが最終回答を選んでいます
            </p>

            <p className="mt-2 text-sm text-gray-500">
              選択が終わるまでお待ちください。
            </p>
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