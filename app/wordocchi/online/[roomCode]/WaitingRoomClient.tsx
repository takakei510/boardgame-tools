"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type WaitingRoomClientProps = {
  roomCode: string;
};

type Player = {
  id: string;
  game_id: string;
  name: string;
  is_host: boolean;
  join_order: number;
  connected: boolean;
};

const MAX_PLAYERS = 8;

export default function WaitingRoomClient({
  roomCode,
}: WaitingRoomClientProps) {
  // Stateはコンポーネント内
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const canStart = players.length >= 2;

  // fetchPlayersもコンポーネント内、useEffectより上
  const fetchPlayers = async (gameId: string) => {
    const { data, error } = await supabase
      .from("players")
      .select("id, game_id, name, is_host, join_order, connected")
      .eq("game_id", gameId)
      .order("join_order", { ascending: true });

    if (error) {
      console.error("参加者取得エラー:", error);
      setErrorMessage("参加者の取得に失敗しました。");
      return;
    }

    setPlayers(data ?? []);
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      setIsLoading(true);
      setErrorMessage("");

      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id")
        .eq("room_code", roomCode)
        .single();

      if (gameError || !game) {
        console.error("部屋取得エラー:", gameError);
        setErrorMessage("部屋が見つかりませんでした。");
        setIsLoading(false);
        return;
      }

      // gameはこの関数内でだけ使う
      await fetchPlayers(game.id);

      channel = supabase
        .channel(`players-${game.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
            filter: `game_id=eq.${game.id}`,
          },
          () => {
            fetchPlayers(game.id);
          },
        )
        .subscribe();

      setIsLoading(false);
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomCode]);

  // setCopiedを使う関数もコンポーネント内
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

          <h1 className="mt-2 text-4xl font-bold text-gray-900">待機ルーム</h1>

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
                {players.length}/{MAX_PLAYERS}人
              </span>
            </div>

            {errorMessage && (
              <p className="mt-4 text-center font-semibold text-red-600">
                {errorMessage}
              </p>
            )}

            <div className="mt-4 space-y-3">
              {isLoading && (
                <p className="text-center text-gray-500">
                  参加者を読み込んでいます...
                </p>
              )}

              {!isLoading &&
                players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <span className="flex items-center gap-3 font-semibold text-gray-800">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          player.connected ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {player.name}
                    </span>

                    {player.is_host && (
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
