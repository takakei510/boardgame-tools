"use client";

import { useState } from "react";
import Link from "next/link";

const samplePlayers = [
  { id: 1, name: "Kei", isHost: true },
  { id: 2, name: "Yuki", isHost: false },
];

export default function WaitingRoomPage() {
  const [copied, setCopied] = useState(false);
  const players = samplePlayers; // 仮の参加者リスト。実際にはサーバーから取得する必要があります。
  const canStart = samplePlayers.length >= 2;
  const roomCode = "ABCD"; // 仮の部屋番号。実際にはサーバーから取得する必要があります。
  const MAX_PLAYERS = 8;

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("部屋番号のコピーに失敗しました。", error);
    }
  };

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-xl">
        <Link
          href="/wordocchi/room"
          className="text-sm font-semibold text-orange-700 hover:underline"
        >
          ← 部屋作成・参加に戻る
        </Link>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-600">オンラインプレイ</p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            待機ルーム
          </h1>

          <div className="mt-8 rounded-2xl bg-orange-100 p-6 text-center">
            <p className="text-sm font-semibold text-orange-700">部屋番号</p>

            <p className="mt-2 text-5xl font-bold tracking-[0.45em] text-gray-900">
              {roomCode}
            </p>

            <button
              type="button"
              onClick={copyRoomCode}
              className="mt-4 rounded-xl border-2 border-orange-500 px-5 py-2 font-bold text-orange-600 transition hover:bg-orange-50"
            >
              {copied ? "コピーしました！" : "部屋番号をコピー"}
            </button>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">参加者</h2>

              <span className="text-sm text-gray-500">
                {samplePlayers.length}/{MAX_PLAYERS}人
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {samplePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <span className="font-semibold text-gray-800">
                    {player.name}
                  </span>

                  {player.isHost && (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
                      👑 親
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!canStart}
            className="mt-8 w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            ゲームを開始する
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            {canStart
              ? "全員が参加したらゲームを開始してください。"
              : "参加者が2人以上になると開始できます。"}
          </p>
        </section>
      </div>
    </main>
  );
}
