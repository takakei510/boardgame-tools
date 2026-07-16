"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { generateRoomCode } from "@/lib/roomCode";
import { savePlayerSession } from "@/lib/session";

export default function WordocchiRoomPage() {
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const getPlayerName = () => {
    const trimmedName = playerName.trim();

    if (trimmedName !== "") {
      return trimmedName;
    }

    const randomNumber = Math.floor(Math.random() * 9000) + 1000;

    return `プレイヤー${randomNumber}`;
  };

  const createRoom = async () => {
    setIsCreating(true);
    setErrorMessage("");

    const displayName = getPlayerName();

    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const generatedRoomCode = generateRoomCode();

        const { data: game, error: gameError } = await supabase
          .from("games")
          .insert({
            room_code: generatedRoomCode,
            game_type: "wordocchi",
            status: "waiting",
          })
          .select("id, room_code")
          .single();

        if (gameError) {
          if (gameError.code === "23505") {
            continue;
          }

          throw new Error(gameError.message);
        }

        if (!game) {
          throw new Error("作成した部屋の情報を取得できませんでした。");
        }

        const { data: player, error: playerError } = await supabase
          .from("players")
          .insert({
            game_id: game.id,
            name: displayName,
            is_host: true,
            join_order: 1,
            connected: true,
          })
          .select("id")
          .single();

        if (playerError || !player) {
          throw new Error(
            playerError?.message ?? "親プレイヤーの登録に失敗しました。",
          );
        }

        const { error: parentError } = await supabase
          .from("games")
          .update({
            parent_player_id: player.id,
          })
          .eq("id", game.id);

        if (parentError) {
          throw new Error(parentError.message);
        }

        savePlayerSession(player.id, game.room_code);

        router.push(`/wordocchi/online/${game.room_code}`);
        return;
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
  const joinRoom = async () => {
    setIsJoining(true);
    setErrorMessage("");

    const displayName = getPlayerName();
    const normalizedRoomCode = roomCode.trim().toUpperCase();

    try {
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id, room_code, status")
        .eq("room_code", normalizedRoomCode)
        .single();

      if (gameError || !game) {
        throw new Error("入力された部屋が見つかりませんでした。");
      }

      if (game.status !== "waiting") {
        throw new Error("この部屋はすでにゲームを開始しています。");
      }

      const { count, error: countError } = await supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .eq("game_id", game.id);

      if (countError) {
        throw new Error(countError.message);
      }

      const playerCount = count ?? 0;

      if (playerCount >= 8) {
        throw new Error("この部屋は満員です。");
      }

      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({
          game_id: game.id,
          name: displayName,
          is_host: false,
          join_order: playerCount + 1,
          connected: true,
        })
        .select("id")
        .single();

      if (playerError || !player) {
        throw new Error(
          playerError?.message ?? "プレイヤーの登録に失敗しました。",
        );
      }

      savePlayerSession(player.id, game.room_code);

      router.push(`/wordocchi/online/${game.room_code}`);
    } catch (error) {
      console.error("部屋参加エラー:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "部屋への参加に失敗しました。",
      );

      setIsJoining(false);
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
          <label className="mt-8 block">
            <span className="text-sm font-bold text-gray-700">
              あなたの名前
            </span>

            <input
              type="text"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="例：NONAME"
              maxLength={20}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-orange-500"
            />
          </label>

          <div className="mt-10 space-y-4">
            <button
              type="button"
              onClick={createRoom}
              disabled={isCreating}
              className="mt-4 w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
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
                value={roomCode}
                onChange={(event) =>
                  setRoomCode(event.target.value.toUpperCase())
                }
                placeholder="例：ABCD"
                maxLength={4}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-bold uppercase tracking-widest text-gray-900 outline-none focus:border-orange-500"
              />
            </label>

            <button
              type="button"
              onClick={joinRoom}
              disabled={roomCode.trim().length !== 4 || isJoining}
              className="w-full rounded-2xl border-2 border-orange-500 px-6 py-4 text-lg font-bold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
            >
              {isJoining ? "参加中..." : "部屋に参加する"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
