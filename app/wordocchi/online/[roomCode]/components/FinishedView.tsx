type FinishedViewProps = {
  roomCode: string;
  finalWord: string;
  onReturnToRoom: () => void;
};

export default function FinishedView({
  roomCode,
  finalWord,
  onReturnToRoom,
}: FinishedViewProps) {
  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-600">オンラインプレイ</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">ゲーム終了</h1>

          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <p className="text-sm font-semibold text-orange-700">部屋番号</p>
            <p className="mt-1 text-2xl font-bold tracking-[0.4em] text-gray-900">
              {roomCode}
            </p>
            <p className="mt-4 text-sm font-semibold text-orange-700">最終ワード</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{finalWord}</p>
          </div>

          <button
            type="button"
            onClick={onReturnToRoom}
            className="mt-8 w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600"
          >
            部屋作成・参加画面へ戻る
          </button>
        </section>
      </div>
    </main>
  );
}
