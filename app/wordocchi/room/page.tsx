"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { generateRoomCode } from "@/lib/roomCode";

export default function WordocchiRoomPage() {
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createRoom = async () => {
    setIsCreating(true);
    setErrorMessage("");

    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const roomCode = generateRoomCode();

        const { error } = await supabase.from("games").insert({
          room_code: roomCode,
          game_type: "wordocchi",
          status: "waiting",
        });

        if (!error) {
          router.push(`/wordocchi/online/${roomCode}`);
          return;
        }

        // room_codeの重複エラーなら、別の番号で再試行
        if (error.code !== "23505") {
          console.error("Supabaseエラー:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });

          throw new Error(error.message);
        }
      }

      throw new Error("部屋番号の生成に失敗しました。");
    } catch (error) {
      console.error("部屋作成エラー:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "部屋の作成に失敗しました。",
      );
      setIsCreating(false);
    }
  };

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
          <p className="text-sm font-bold text-orange-600">オンラインプレイ</p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">ワードッチ</h1>

          <p className="mt-4 text-gray-600">
            部屋を作るか、友達から共有された部屋番号を入力してください。
          </p>

          <div className="mt-10 space-y-4">
            <button
              type="button"
              onClick={createRoom}
              disabled={isCreating}
              className="w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isCreating ? "部屋を作成中..." : "新しい部屋を作る"}
            </button>
            {errorMessage && (
              <p className="text-center text-sm font-semibold text-red-600">
                {errorMessage}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-500">または</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <label className="block">
              <span className="text-sm font-bold text-gray-700">部屋番号</span>

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
