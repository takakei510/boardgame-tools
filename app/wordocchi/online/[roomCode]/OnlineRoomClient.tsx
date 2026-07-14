"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearPlayerSession, getPlayerId } from "@/lib/session";
import wordocchiTopics from "@/data/wordocchiTopics.json";
import wordocchiWords from "@/data/wordocchiWords.json";
import {
  buildGameStartPayload,
  findSubmissionForRound,
  getFirstAnsweringPlayer,
  getNextAnsweringPlayer,
  normalizeFirstWordCandidates,
  type FirstWordCandidate,
  type GameRow,
  type PlayerRow,
  type SubmissionRow,
} from "@/lib/wordocchiGame";
import WaitingRoomView from "./components/WaitingRoomView";
import FirstWordSelectView from "./components/FirstWordSelectView";
import PlayerInputView from "./components/PlayerInputView";
import HostSelectView from "./components/HostSelectView";
import FinishedView from "./components/FinishedView";

type RoomSnapshot = {
  game: GameRow;
  players: PlayerRow[];
  submission: SubmissionRow | null;
  topicText: string;
  firstWordCandidates: FirstWordCandidate[];
};

type OnlineRoomClientProps = {
  roomCode: string;
};

export default function OnlineRoomClient({ roomCode }: OnlineRoomClientProps) {
  const router = useRouter();
  const roomClosedRef = useRef(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomSnapshot, setRoomSnapshot] = useState<RoomSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isSelectingFirstWord, setIsSelectingFirstWord] = useState(false);
  const [answerDraft, setAnswerDraft] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isResolvingSelection, setIsResolvingSelection] = useState(false);

  const clearAndLeave = useCallback(
    (target: string) => {
      clearPlayerSession();
      router.replace(target);
    },
    [router],
  );

  const handleRoomClosed = useCallback(() => {
    if (roomClosedRef.current) {
      return;
    }

    roomClosedRef.current = true;
    clearAndLeave("/wordocchi/room?reason=host-left");
  }, [clearAndLeave]);

  const loadRoomSnapshot = useCallback(async (): Promise<RoomSnapshot | null> => {
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select(
        "id, room_code, game_type, status, topic_id, current_word, current_player_id, round_number, created_at, first_word_candidates",
      )
      .eq("room_code", roomCode)
      .maybeSingle();

    if (gameError) {
      console.error("部屋取得エラー:", gameError);
      setErrorMessage("部屋情報の取得に失敗しました。");
      return null;
    }

    if (!game) {
      handleRoomClosed();
      return null;
    }

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, game_id, name, is_host, join_order, connected")
      .eq("game_id", game.id)
      .order("join_order", { ascending: true });

    if (playersError) {
      console.error("参加者取得エラー:", playersError);
      setErrorMessage("参加者の取得に失敗しました。");
      return null;
    }

    const topic = wordocchiTopics.find((item) => item.id === game.topic_id);
    const roundNumber = game.round_number ?? 0;
    let submission: SubmissionRow | null = null;

    if (roundNumber > 0) {
      const { data: submissions, error: submissionError } = await supabase
        .from("submissions")
        .select(
          "id, game_id, player_id, word, round_number, selected, created_at",
        )
        .eq("game_id", game.id)
        .eq("round_number", roundNumber)
        .order("created_at", { ascending: false });

      if (submissionError) {
        console.error("回答取得エラー:", submissionError);
        setErrorMessage("回答の取得に失敗しました。");
        return null;
      }

      submission = findSubmissionForRound(submissions ?? [], roundNumber);
    }

    return {
      game,
      players: players ?? [],
      submission,
      topicText: topic?.text ?? "お題が見つかりませんでした",
      firstWordCandidates: normalizeFirstWordCandidates(
        game.first_word_candidates,
      ),
    };
  }, [handleRoomClosed, roomCode]);

  const refreshRoomSnapshot = useCallback(async () => {
    const snapshot = await loadRoomSnapshot();

    if (!snapshot) {
      return;
    }

    setRoomSnapshot(snapshot);
    setErrorMessage("");

    if (!playerId) {
      clearAndLeave("/wordocchi/room");
      return;
    }

    const currentPlayer = snapshot.players.find((player) => player.id === playerId);

    if (!currentPlayer) {
      clearPlayerSession();
      router.replace("/wordocchi/room");
    }
  }, [clearAndLeave, loadRoomSnapshot, playerId, router]);

  useEffect(() => {
    let isActive = true;
    let gamesChannel: ReturnType<typeof supabase.channel> | null = null;
    let playersChannel: ReturnType<typeof supabase.channel> | null = null;
    let submissionsChannel: ReturnType<typeof supabase.channel> | null = null;
    let roomCheckInterval: number | null = null;

    const setup = async () => {
      setIsLoading(true);
      setErrorMessage("");

      const storedPlayerId = getPlayerId();

      if (!storedPlayerId) {
        clearAndLeave("/wordocchi/room");
        return;
      }

      setPlayerId(storedPlayerId);

      const snapshot = await loadRoomSnapshot();

      if (!isActive) {
        return;
      }

      if (!snapshot) {
        setIsLoading(false);
        return;
      }

      setRoomSnapshot(snapshot);

      const currentPlayer = snapshot.players.find(
        (player) => player.id === storedPlayerId,
      );

      if (!currentPlayer) {
        clearPlayerSession();
        router.replace("/wordocchi/room");
        setIsLoading(false);
        return;
      }

      gamesChannel = supabase
        .channel(`games-${snapshot.game.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "games",
            filter: `id=eq.${snapshot.game.id}`,
          },
          async () => {
            if (!isActive) {
              return;
            }

            await refreshRoomSnapshot();
          },
        )
        .subscribe();

      playersChannel = supabase
        .channel(`players-${snapshot.game.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
            filter: `game_id=eq.${snapshot.game.id}`,
          },
          async () => {
            if (!isActive) {
              return;
            }

            await refreshRoomSnapshot();
          },
        )
        .subscribe();

      submissionsChannel = supabase
        .channel(`submissions-${snapshot.game.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "submissions",
            filter: `game_id=eq.${snapshot.game.id}`,
          },
          async () => {
            if (!isActive) {
              return;
            }

            await refreshRoomSnapshot();
          },
        )
        .subscribe();

      roomCheckInterval = window.setInterval(async () => {
        if (!isActive) {
          return;
        }

        const { data: roomExists } = await supabase
          .from("games")
          .select("id")
          .eq("room_code", roomCode)
          .maybeSingle();

        if (!roomExists) {
          handleRoomClosed();
        }
      }, 5000);

      setIsLoading(false);
    };

    void setup();

    return () => {
      isActive = false;

      if (roomCheckInterval !== null) {
        window.clearInterval(roomCheckInterval);
      }

      if (gamesChannel) {
        void supabase.removeChannel(gamesChannel);
      }

      if (playersChannel) {
        void supabase.removeChannel(playersChannel);
      }

      if (submissionsChannel) {
        void supabase.removeChannel(submissionsChannel);
      }
    };
  }, [handleRoomClosed, loadRoomSnapshot, refreshRoomSnapshot, roomCode, clearAndLeave, router]);

  const currentPlayer = useMemo(() => {
    if (!roomSnapshot || !playerId) {
      return null;
    }

    return roomSnapshot.players.find((player) => player.id === playerId) ?? null;
  }, [playerId, roomSnapshot]);

  const isHost = currentPlayer?.is_host ?? false;
  const isCurrentPlayer = roomSnapshot?.game.current_player_id === playerId;
  const currentWord = roomSnapshot?.game.current_word ?? "まだ選ばれていません";
  const topicText = roomSnapshot?.topicText ?? "お題を読み込んでいます";
  const currentPlayerName =
    roomSnapshot?.players.find(
      (player) => player.id === roomSnapshot?.game.current_player_id,
    )?.name ?? "次の回答者";
  const currentSubmission = roomSnapshot?.submission ?? null;
  const currentSubmissionPlayerName =
    currentSubmission && roomSnapshot
      ? roomSnapshot.players.find((player) => player.id === currentSubmission.player_id)
          ?.name ?? null
      : null;
  const canStart = (roomSnapshot?.players.length ?? 0) >= 2;

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("部屋番号のコピーに失敗しました。", error);
    }
  };

  const startGame = async () => {
    if (!roomSnapshot || !isHost || isStartingGame || !canStart) {
      return;
    }

    setIsStartingGame(true);
    setErrorMessage("");

    try {
      const payload = buildGameStartPayload(wordocchiTopics, wordocchiWords);

      const { error } = await supabase
        .from("games")
        .update({
          topic_id: payload.topicId,
          first_word_candidates: payload.firstWordCandidates,
          status: "select_first_word",
          round_number: 0,
          current_word: null,
          current_player_id: null,
        })
        .eq("id", roomSnapshot.game.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("ゲーム開始エラー:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "ゲーム開始に失敗しました。",
      );
    } finally {
      setIsStartingGame(false);
    }
  };

  const selectFirstWord = async (candidate: FirstWordCandidate) => {
    if (!roomSnapshot || !isHost || isSelectingFirstWord) {
      return;
    }

    const nextPlayer = getFirstAnsweringPlayer(roomSnapshot.players);

    if (!nextPlayer) {
      setErrorMessage("回答する子プレイヤーが見つかりませんでした。");
      return;
    }

    setIsSelectingFirstWord(true);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("games")
        .update({
          current_word: candidate.text,
          current_player_id: nextPlayer.id,
          round_number: 1,
          status: "player_input",
        })
        .eq("id", roomSnapshot.game.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("最初のワード選択エラー:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "最初のワード選択に失敗しました。",
      );
    } finally {
      setIsSelectingFirstWord(false);
    }
  };

  const submitAnswer = async () => {
    if (!roomSnapshot || !playerId || !isCurrentPlayer || isSubmittingAnswer) {
      return;
    }

    const trimmedAnswer = answerDraft.trim();

    if (trimmedAnswer.length < 1 || trimmedAnswer.length > 50) {
      setErrorMessage("回答は1〜50文字で入力してください。");
      return;
    }

    setIsSubmittingAnswer(true);
    setErrorMessage("");

    try {
      const roundNumber = roomSnapshot.game.round_number;

      const { error: insertError } = await supabase.from("submissions").insert({
        game_id: roomSnapshot.game.id,
        player_id: playerId,
        word: trimmedAnswer,
        round_number: roundNumber,
        selected: false,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      const { error: gameError } = await supabase
        .from("games")
        .update({ status: "host_select" })
        .eq("id", roomSnapshot.game.id);

      if (gameError) {
        throw new Error(gameError.message);
      }

      setAnswerDraft("");
    } catch (error) {
      console.error("回答送信エラー:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "回答の送信に失敗しました。",
      );
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const resolveHostSelection = async (selectedSubmissionWord: string | null) => {
    if (!roomSnapshot || !isHost || isResolvingSelection) {
      return;
    }

    const nextPlayer = getNextAnsweringPlayer(
      roomSnapshot.players,
      roomSnapshot.game.current_player_id,
    );

    if (!nextPlayer) {
      setErrorMessage("次の回答者を決定できませんでした。");
      return;
    }

    setIsResolvingSelection(true);
    setErrorMessage("");

    try {
      if (selectedSubmissionWord && currentSubmission) {
        const { error: updateSubmissionError } = await supabase
          .from("submissions")
          .update({ selected: true })
          .eq("id", currentSubmission.id);

        if (updateSubmissionError) {
          throw new Error(updateSubmissionError.message);
        }
      }

      const { error: gameError } = await supabase
        .from("games")
        .update({
          current_word: selectedSubmissionWord ?? roomSnapshot.game.current_word,
          current_player_id: nextPlayer.id,
          round_number: roomSnapshot.game.round_number + 1,
          status: "player_input",
        })
        .eq("id", roomSnapshot.game.id);

      if (gameError) {
        throw new Error(gameError.message);
      }
    } catch (error) {
      console.error("判定結果の保存エラー:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "判定結果の保存に失敗しました。",
      );
    } finally {
      setIsResolvingSelection(false);
    }
  };

  const finishGame = async () => {
    if (!roomSnapshot || !isHost) {
      return;
    }

    try {
      const { error } = await supabase
        .from("games")
        .update({ status: "finished" })
        .eq("id", roomSnapshot.game.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("ゲーム終了エラー:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "ゲームを終了できませんでした。",
      );
    }
  };

  const leaveRoom = async () => {
    const storedPlayerId = playerId ?? getPlayerId();

    if (!storedPlayerId) {
      clearAndLeave("/wordocchi/room");
      return;
    }

    setErrorMessage("");

    try {
      const { data: currentPlayer, error: fetchError } = await supabase
        .from("players")
        .select("id, is_host")
        .eq("id", storedPlayerId)
        .maybeSingle();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!currentPlayer) {
        clearAndLeave("/wordocchi/room");
        return;
      }

      if (currentPlayer.is_host) {
        const { error: deleteGameError } = await supabase
          .from("games")
          .delete()
          .eq("room_code", roomCode);

        if (deleteGameError) {
          throw new Error(deleteGameError.message);
        }
      } else {
        const { error: deletePlayerError } = await supabase
          .from("players")
          .delete()
          .eq("id", storedPlayerId);

        if (deletePlayerError) {
          throw new Error(deletePlayerError.message);
        }
      }

      clearAndLeave("/wordocchi/room");
    } catch (error) {
      console.error("退出エラー:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "部屋から退出できませんでした。",
      );
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-orange-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-lg font-bold text-gray-900">読み込み中...</p>
          <p className="mt-2 text-sm text-gray-500">部屋情報を確認しています。</p>
        </div>
      </main>
    );
  }

  if (!roomSnapshot) {
    return (
      <main className="min-h-screen bg-orange-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-lg font-bold text-gray-900">
            {errorMessage || "部屋情報を取得できませんでした。"}
          </p>
          <button
            type="button"
            onClick={() => clearAndLeave("/wordocchi/room")}
            className="mt-6 rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            部屋作成・参加画面へ戻る
          </button>
        </div>
      </main>
    );
  }

  const showEndButton = isHost && roomSnapshot.game.status !== "waiting";

  if (roomSnapshot.game.status === "waiting") {
    return (
      <WaitingRoomView
        roomCode={roomCode}
        players={roomSnapshot.players}
        isHost={isHost}
        canStart={(roomSnapshot.players.length ?? 0) >= 2}
        isStarting={isStartingGame}
        copied={copied}
        errorMessage={errorMessage}
        onCopyRoomCode={copyRoomCode}
        onStartGame={startGame}
        onLeaveRoom={leaveRoom}
      />
    );
  }

  if (roomSnapshot.game.status === "select_first_word") {
    return (
      <div className="relative min-h-screen">
        {showEndButton && (
          <div className="absolute right-6 top-6 z-10">
            <button
              type="button"
              onClick={finishGame}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              ゲームを終了する
            </button>
          </div>
        )}
        <FirstWordSelectView
          roomCode={roomCode}
          topicText={topicText}
          candidates={roomSnapshot.firstWordCandidates}
          isHost={isHost}
          isSelecting={isSelectingFirstWord}
          errorMessage={errorMessage}
          onSelectCandidate={selectFirstWord}
        />
      </div>
    );
  }

  if (roomSnapshot.game.status === "player_input") {
    return (
      <div className="relative min-h-screen">
        {showEndButton && (
          <div className="absolute right-6 top-6 z-10">
            <button
              type="button"
              onClick={finishGame}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              ゲームを終了する
            </button>
          </div>
        )}
        <PlayerInputView
          roomCode={roomCode}
          topicText={topicText}
          currentWord={currentWord}
          currentPlayerName={currentPlayerName}
          isHost={isHost}
          isCurrentPlayer={isCurrentPlayer}
          answerDraft={answerDraft}
          isSubmitting={isSubmittingAnswer}
          errorMessage={errorMessage}
          onChangeAnswer={setAnswerDraft}
          onSubmitAnswer={submitAnswer}
        />
      </div>
    );
  }

  if (roomSnapshot.game.status === "host_select") {
    return (
      <div className="relative min-h-screen">
        {showEndButton && (
          <div className="absolute right-6 top-6 z-10">
            <button
              type="button"
              onClick={finishGame}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              ゲームを終了する
            </button>
          </div>
        )}
        <HostSelectView
          roomCode={roomCode}
          topicText={topicText}
          currentWord={currentWord}
          submissionWord={roomSnapshot.submission?.word ?? null}
          submissionPlayerName={currentSubmissionPlayerName}
          isHost={isHost}
          errorMessage={errorMessage}
          isResolvingSelection={isResolvingSelection}
          onChooseCurrentWord={() => resolveHostSelection(null)}
          onChooseSubmission={() =>
            resolveHostSelection(roomSnapshot.submission?.word ?? null)
          }
        />
      </div>
    );
  }

  return (
    <FinishedView
      roomCode={roomCode}
      finalWord={currentWord}
      onReturnToRoom={leaveRoom}
    />
  );
}
