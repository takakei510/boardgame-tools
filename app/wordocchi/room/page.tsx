import Link from "next/link";

export default function WordocchiRoomPage() {
  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-xl">
        <Link
          href="/wordocchi"
          className="text-sm font-semibold text-orange-700 hover:underline"
        >
          ← お題ジェネレーターに戻る
        </Link>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-600">
            オンラインプレイ
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            ワードッチ
          </h1>

          <p className="mt-4 text-gray-600">
            部屋を作るか、友達から共有された部屋番号を入力してください。
          </p>

          <div className="mt-10 space-y-4">
            <button
              type="button"
              className="w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600"
            >
              新しい部屋を作る
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-500">または</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                部屋番号
              </span>

              <input
                type="text"
                placeholder="例：ABCD"
                maxLength={6}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-bold uppercase tracking-widest text-gray-900 outline-none focus:border-orange-500"
              />
            </label>

            <button
              type="button"
              className="w-full rounded-2xl border-2 border-orange-500 px-6 py-4 text-lg font-bold text-orange-600 transition hover:bg-orange-50"
            >
              部屋に参加する
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}