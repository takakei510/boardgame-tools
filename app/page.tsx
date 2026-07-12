import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-6xl p-8">
        <h1 className="text-5xl font-bold text-gray-900">
          🎲 BoardGame Tools
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          ボードゲームをもっと楽しくするWebツール集
        </p>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">ゲーム別ツール</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/wordocchi"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl">🟧</div>

              <h3 className="mt-4 text-2xl font-bold text-gray-900">
                ワードッチ
              </h3>

              <p className="mt-2 text-gray-600">お題ジェネレーター</p>

              <p className="mt-6 font-semibold text-orange-600">
                開く →
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}