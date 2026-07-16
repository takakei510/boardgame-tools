"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearPlayerSession, getPlayerId } from "@/lib/session";
import wordocchiTopics from "@/data/wordocchiTopics.json";
import wordocchiWords from "@/data/wordocchiWords.json";
import {
  finishGame as buildFinishGamePayload,
  getFirstAnsweringPlayer,
  getNextUnansweredPlayer,
  getSubmissionsForTopicRound,
  normalizeFirstWordCandidates,
  selectFirstWord as buildFirstWordPayload,
  startGame as buildStartGamePayload,
  startNextTopic as buildNextTopicPayload,
  submitWord as buildSubmissionPayload,
  type FirstWordCandidate,
  type GameRow,
  type PlayerRow,
  type SubmissionRow,
} from "@/lib/wordocchiGame";
import WaitingRoomView from "./components/WaitingRoomView";
import FirstWordSelectView from "./components/FirstWordSelectView";
import PlayerInputView from "./components/PlayerInputView";
import HostSelectView from "./components/HostSelectView";
import TopicResultView from "./components/TopicResultView";
import FinishedView from "./components/FinishedView";
import FinalAnswerView from "./components/FinalAnswerView";
import FinalSelectView from "./components/FinalSelectView";
import TransitionOverlay from "./components/TransitionOverlay";

type RoomSnapshot = {
  game: GameRow;
  players: PlayerRow[];
  submissions: SubmissionRow[];
  topicText: string;
  firstWordCandidates: FirstWordCandidate[];
};

type OnlineRoomClientProps = {
  roomCode: string;
};

type TopicResultEntry = {
  roundNumber: number;
  playerName: string;
  word: string;
  selected: boolean;
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
  const [isResolvingSelection, setIsResolvingSelection] = useState(false);
  const [isAdvancingTopic, setIsAdvancingTopic] = useState(false);
  const [isFinishingGame, setIsFinishingGame] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [answerDraft, setAnswerDraft] = useState("");
  const [isUpdatingCycles, setIsUpdatingCycles] = useState(false);
  const [finalAnswerDraft, setFinalAnswerDraft] = useState("");
  const [isSubmittingFinalAnswer, setIsSubmittingFinalAnswer] = useState(false);
  const [isSelectingFinalAnswer, setIsSelectingFinalAnswer] = useState(false);

  const isTransitioning =
    isStartingGame ||
    isSelectingFirstWord ||
    isResolvingSelection ||
    isAdvancingTopic ||
    isFinishingGame ||
    isSelectingFinalAnswer;

  const transitionMessage = isStartingGame
    ? "ゲームを開始しています..."
    : isSelectingFirstWord
      ? "最初のワードを決定しています..."
      : isResolvingSelection
        ? "次の回答者へ進んでいます..."
        : isSelectingFinalAnswer
          ? "最終回答を決定しています..."
          : isAdvancingTopic
            ? "次のお題を準備しています..."
            : isFinishingGame
              ? "ゲームを終了しています..."
              : "次の画面を準備しています...";

  const updateAnswerCycles = async (value: number) => {
    if (!roomSnapshot || !isParent || isUpdatingCycles) {
      return;
    }

    const nextValue = Math.max(1, Math.min(5, value));
    const previousValue = roomSnapshot.game.answer_cycles;

    if (nextValue === previousValue) {
      return;
    }

    // 押した瞬間に画面へ反映
    setRoomSnapshot((previousSnapshot) => {
      if (!previousSnapshot) {
        return previousSnapshot;
      }

      return {
        ...previousSnapshot,
        game: {
          ...previousSnapshot.game,
          answer_cycles: nextValue,
        },
      };
    });

    setIsUpdatingCycles(true);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("games")
        .update({
          answer_cycles: nextValue,
        })
        .eq("id", roomSnapshot.game.id)
        .eq("status", "waiting");

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("周回数更新エラー:", error);

      // 失敗した場合だけ元の値に戻す
      setRoomSnapshot((previousSnapshot) => {
        if (!previousSnapshot) {
          return previousSnapshot;
        }

        return {
          ...previousSnapshot,
          game: {
            ...previousSnapshot.game,
            answer_cycles: previousValue,
          },
        };
      });

      setErrorMessage("周回数の変更に失敗しました。");
    } finally {
      setIsUpdatingCycles(false);
    }
  };

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

  const loadRoomSnapshot =
    useCallback(async (): Promise<RoomSnapshot | null> => {
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select(
          `
            id,
            room_code,
            game_type,
            status,
            topic_id,
            topic_round,
            initial_word,
            current_word,
            current_player_id,
            parent_player_id,
            round_number,
            answer_cycles,
            current_cycle,
            created_at,
            first_word_candidates,
            used_topic_ids
          `,
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
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select(
          "id, game_id, player_id, word, round_number, topic_round, answer_phase, cycle_number, selected, created_at",
        )
        .eq("game_id", game.id)
        .eq("topic_round", game.topic_round)
        .order("round_number", { ascending: true });

      if (submissionsError) {
        console.error("回答取得エラー:", submissionsError);
        setErrorMessage("回答の取得に失敗しました。");
        return null;
      }

      return {
        game,
        players: players ?? [],
        submissions: submissions ?? [],
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

    const currentPlayer = snapshot.players.find(
      (player) => player.id === playerId,
    );

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
  }, [
    handleRoomClosed,
    loadRoomSnapshot,
    refreshRoomSnapshot,
    roomCode,
    clearAndLeave,
    router,
  ]);

  const currentPlayer = useMemo(() => {
    if (!roomSnapshot || !playerId) {
      return null;
    }

    return (
      roomSnapshot.players.find((player) => player.id === playerId) ?? null
    );
  }, [playerId, roomSnapshot]);

  const childPlayers = useMemo(() => {
    if (!roomSnapshot) {
      return [];
    }

    return roomSnapshot.players.filter(
      (player) => player.id !== roomSnapshot.game.parent_player_id,
    );
  }, [roomSnapshot]);

  const finalSubmissions = useMemo(() => {
    if (!roomSnapshot) {
      return [];
    }

    return roomSnapshot.submissions.filter(
      (submission) =>
        submission.topic_round === roomSnapshot.game.topic_round &&
        submission.answer_phase === "final",
    );
  }, [roomSnapshot]);

  const hasSubmittedFinalAnswer = useMemo(() => {
    if (!playerId) {
      return false;
    }

    return finalSubmissions.some(
      (submission) => submission.player_id === playerId,
    );
  }, [finalSubmissions, playerId]);

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
    if (!roomSnapshot || !isRoomHost || isStartingGame || !canStart) {
      return;
    }

    setIsStartingGame(true);
    setErrorMessage("");

    try {
      const payload = buildStartGamePayload(wordocchiTopics, wordocchiWords);

      const { error } = await supabase
        .from("games")
        .update({
          topic_id: payload.topicId,
          first_word_candidates: payload.firstWordCandidates,
          used_topic_ids: payload.usedTopicIds,
          initial_word: null,
          current_word: null,
          current_player_id: null,
          current_cycle: 1,
          round_number: 0,
          topic_round: 1,
          status: "select_first_word",
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
    if (!roomSnapshot || !isRoomHost || isSelectingFirstWord) {
      return;
    }

    const firstAnsweringPlayer = getFirstAnsweringPlayer(
      roomSnapshot.players,
      roomSnapshot.game.parent_player_id,
    );

    if (!firstAnsweringPlayer) {
      setErrorMessage("回答する子プレイヤーが見つかりませんでした。");
      return;
    }

    setIsSelectingFirstWord(true);
    setErrorMessage("");

    try {
      const payload = buildFirstWordPayload(candidate, firstAnsweringPlayer);

      const { error } = await supabase
        .from("games")
        .update(payload)
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

  const selectedFinalSubmission = useMemo(() => {
    return finalSubmissions.find((submission) => submission.selected) ?? null;
  }, [finalSubmissions]);

  const selectedFinalPlayer = useMemo(() => {
    if (!selectedFinalSubmission || !roomSnapshot) {
      return null;
    }

    return (
      roomSnapshot.players.find(
        (player) => player.id === selectedFinalSubmission.player_id,
      ) ?? null
    );
  }, [roomSnapshot, selectedFinalSubmission]);

  const submitAnswer = async () => {
    if (
      !roomSnapshot ||
      !playerId ||
      !isCurrentPlayer ||
      isSubmittingAnswer ||
      isStartingGame ||
      isSelectingFirstWord ||
      isResolvingSelection ||
      isAdvancingTopic ||
      isFinishingGame
    ) {
      return;
    }

    const trimmedAnswer = answerDraft.trim();

    if (trimmedAnswer.length < 1 || trimmedAnswer.length > 50) {
      setErrorMessage("回答は1〜50文字で入力してください。");
      return;
    }

    if (
      roomSnapshot.submissions.some(
        (submission) =>
          submission.player_id === playerId &&
          submission.topic_round === roomSnapshot.game.topic_round &&
          submission.answer_phase === "normal" &&
          submission.cycle_number === roomSnapshot.game.current_cycle,
      )
    ) {
      setErrorMessage("この周回にはすでに回答しています。");
      return;
    }

    setIsSubmittingAnswer(true);
    setErrorMessage("");

    try {
      const payload = buildSubmissionPayload(
        roomSnapshot.game.id,
        playerId,
        trimmedAnswer,
        roomSnapshot.game.round_number,
        roomSnapshot.game.topic_round,
        roomSnapshot.game.current_cycle,
      );

      const { error: insertError } = await supabase
        .from("submissions")
        .insert(payload);

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("この周回にはすでに回答しています。");
        }

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

  const submitFinalAnswer = async () => {
    if (
      !roomSnapshot ||
      !playerId ||
      !isRoomHost ||
      roomSnapshot.game.status !== "final_input" ||
      hasSubmittedFinalAnswer ||
      isSubmittingFinalAnswer
    ) {
      return;
    }

    const trimmedAnswer = finalAnswerDraft.trim();

    if (trimmedAnswer.length < 1 || trimmedAnswer.length > 50) {
      setErrorMessage("最終回答は1〜50文字で入力してください。");
      return;
    }

    setIsSubmittingFinalAnswer(true);
    setErrorMessage("");

    try {
      const { error: insertError } = await supabase.from("submissions").insert({
        game_id: roomSnapshot.game.id,
        player_id: playerId,
        word: trimmedAnswer,
        round_number: roomSnapshot.game.round_number + 1,
        topic_round: roomSnapshot.game.topic_round,
        answer_phase: "final",
        cycle_number: roomSnapshot.game.current_cycle,
        selected: false,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("最終回答はすでに送信しています。");
        }

        throw new Error(insertError.message);
      }

      setFinalAnswerDraft("");

      const { data: submittedAnswers, error: fetchError } = await supabase
        .from("submissions")
        .select("player_id")
        .eq("game_id", roomSnapshot.game.id)
        .eq("topic_round", roomSnapshot.game.topic_round)
        .eq("answer_phase", "final");

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const submittedPlayerIds = new Set(
        (submittedAnswers ?? []).map((answer) => answer.player_id),
      );

      const allPlayersSubmitted = childPlayers.every((player) =>
        submittedPlayerIds.has(player.id),
      );

      if (allPlayersSubmitted) {
        const { error: gameError } = await supabase
          .from("games")
          .update({
            status: "final_select",
            current_player_id: null,
          })
          .eq("id", roomSnapshot.game.id)
          .eq("status", "final_input");

        if (gameError) {
          throw new Error(gameError.message);
        }
      }
    } catch (error) {
      console.error("最終回答送信エラー:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "最終回答の送信に失敗しました。",
      );
    } finally {
      setIsSubmittingFinalAnswer(false);
    }
  };

  const selectFinalAnswer = async (submission: SubmissionRow) => {
    if (
      !roomSnapshot ||
      !isRoomHost ||
      roomSnapshot.game.status !== "final_select" ||
      submission.answer_phase !== "final" ||
      isSelectingFinalAnswer
    ) {
      return;
    }

    setIsSelectingFinalAnswer(true);
    setErrorMessage("");

    try {
      const { error: submissionError } = await supabase
        .from("submissions")
        .update({
          selected: true,
        })
        .eq("id", submission.id)
        .eq("game_id", roomSnapshot.game.id)
        .eq("topic_round", roomSnapshot.game.topic_round)
        .eq("answer_phase", "final");

      if (submissionError) {
        throw new Error(submissionError.message);
      }

      const { error: gameError } = await supabase
        .from("games")
        .update({
          status: "topic_result",
          current_player_id: null,
        })
        .eq("id", roomSnapshot.game.id)
        .eq("status", "final_select");

      if (gameError) {
        throw new Error(gameError.message);
      }
    } catch (error) {
      console.error("最終回答選択エラー:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "最終回答の選択に失敗しました。",
      );
    } finally {
      setIsSelectingFinalAnswer(false);
    }
  };

  const resolveHostSelection = async (selectedCurrentWord: boolean) => {
    if (!roomSnapshot || !isRoomHost || isResolvingSelection) {
      return;
    }

    const nextPlayer = getNextUnansweredPlayer(
      roomSnapshot.players,
      roomSnapshot.submissions,
      roomSnapshot.game.topic_round,
      roomSnapshot.game.current_cycle,
      roomSnapshot.game.parent_player_id,
    );

    const selectedSubmission = selectedCurrentWord
      ? null
      : currentRoundSubmission;

    setIsResolvingSelection(true);
    setErrorMessage("");

    try {
      if (!selectedCurrentWord && currentRoundSubmission) {
        const { error: updateSubmissionError } = await supabase
          .from("submissions")
          .update({ selected: true })
          .eq("id", currentRoundSubmission.id);

        if (updateSubmissionError) {
          throw new Error(updateSubmissionError.message);
        }
      }

      const nextCurrentWord =
        selectedSubmission?.word ?? roomSnapshot.game.current_word;
      if (nextPlayer) {
        const { error: gameError } = await supabase
          .from("games")
          .update({
            current_word: nextCurrentWord,
            current_player_id: nextPlayer.id,
            round_number: roomSnapshot.game.round_number + 1,
            status: "player_input",
          })
          .eq("id", roomSnapshot.game.id);

        if (gameError) {
          throw new Error(gameError.message);
        }

        return;
      }

      if (roomSnapshot.game.current_cycle < roomSnapshot.game.answer_cycles) {
        const firstPlayer = getFirstAnsweringPlayer(
          roomSnapshot.players,
          roomSnapshot.game.parent_player_id
        );

        if (!firstPlayer) {
          throw new Error("次の周回で回答するプレイヤーが見つかりません。");
        }

        const { error: gameError } = await supabase
          .from("games")
          .update({
            current_word: nextCurrentWord,
            current_cycle: roomSnapshot.game.current_cycle + 1,
            current_player_id: firstPlayer.id,
            round_number: roomSnapshot.game.round_number + 1,
            status: "player_input",
          })
          .eq("id", roomSnapshot.game.id);

        if (gameError) {
          throw new Error(gameError.message);
        }

        return;
      }

      const { error: gameError } = await supabase
        .from("games")
        .update({
          current_word: nextCurrentWord,
          current_player_id: null,
          status: "final_input",
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

  const advanceToNextTopic = async () => {
    if (!roomSnapshot || !isRoomHost || isAdvancingTopic) {
      return;
    }

    setIsAdvancingTopic(true);
    setErrorMessage("");

    try {
      const payload = buildNextTopicPayload(
        wordocchiTopics,
        wordocchiWords,
        roomSnapshot.game.used_topic_ids,
        roomSnapshot.game.topic_id,
        roomSnapshot.game.topic_round,
      );

      const { error } = await supabase
        .from("games")
        .update({
          topic_id: payload.topicId,
          first_word_candidates: payload.firstWordCandidates,
          used_topic_ids: payload.usedTopicIds,
          initial_word: payload.initial_word,
          current_word: payload.current_word,
          current_player_id: payload.current_player_id,
          current_cycle: 1,
          round_number: payload.round_number,
          topic_round: payload.topic_round,
          status: payload.status,
        })
        .eq("id", roomSnapshot.game.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("次のお題の準備エラー:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "次のお題の準備に失敗しました。",
      );
    } finally {
      setIsAdvancingTopic(false);
    }
  };

  const finishGame = async () => {
    if (!roomSnapshot || !isRoomHost || isFinishingGame) {
      return;
    }

    setIsFinishingGame(true);
    setErrorMessage("");

    try {
      const payload = buildFinishGamePayload();

      const { error } = await supabase
        .from("games")
        .update(payload)
        .eq("id", roomSnapshot.game.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("ゲーム終了エラー:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "ゲームを終了できませんでした。",
      );
    } finally {
      setIsFinishingGame(false);
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
        error instanceof Error
          ? error.message
          : "部屋から退出できませんでした。",
      );
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-orange-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-lg font-bold text-gray-900">読み込み中...</p>
          <p className="mt-2 text-sm text-gray-500">
            部屋情報を確認しています。
          </p>
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

  const snapshot = roomSnapshot;
  const isRoomHost = currentPlayer?.is_host ?? false;
  const isParent = snapshot.game.parent_player_id === currentPlayer?.id;
  const isCurrentPlayer = snapshot.game.current_player_id === playerId;
  const currentWord = snapshot.game.current_word ?? "まだ選ばれていません";
  const topicText = snapshot.topicText ?? "お題を読み込んでいます";
  const currentPlayerName =
    snapshot.players.find(
      (player) => player.id === snapshot.game.current_player_id,
    )?.name ?? "次の回答者";
  const currentRoundSubmission =
    snapshot.submissions.find(
      (submission) => submission.round_number === snapshot.game.round_number,
    ) ?? null;
  const topicSubmissions = getSubmissionsForTopicRound(
    snapshot.submissions,
    snapshot.game.topic_round,
  );
  const topicResultEntries: TopicResultEntry[] = topicSubmissions.map(
    (submission) => ({
      roundNumber: submission.round_number,
      playerName:
        snapshot.players.find((player) => player.id === submission.player_id)
          ?.name ?? "不明なプレイヤー",
      word: submission.word,
      selected: submission.selected,
    }),
  );
  const currentSubmissionPlayerName = currentRoundSubmission
    ? (snapshot.players.find(
        (player) => player.id === currentRoundSubmission.player_id,
      )?.name ?? null)
    : null;
  const canStart = snapshot.players.length >= 2;

  const showEndButton =
    isRoomHost &&
    snapshot.game.status !== "waiting" &&
    snapshot.game.status !== "topic_result";

  if (snapshot.game.status === "waiting") {
    return (
      <WaitingRoomView
        roomCode={roomCode}
        players={snapshot.players}
        isHost={isRoomHost}
        canStart={canStart}
        isStarting={isStartingGame}
        copied={copied}
        errorMessage={errorMessage}
        answerCycles={roomSnapshot.game.answer_cycles ?? 1}
        onCopyRoomCode={copyRoomCode}
        onStartGame={startGame}
        onLeaveRoom={leaveRoom}
        onIncrease={() =>
          updateAnswerCycles(roomSnapshot.game.answer_cycles + 1)
        }
        onDecrease={() =>
          updateAnswerCycles(roomSnapshot.game.answer_cycles - 1)
        }
        isUpdatingCycles={isUpdatingCycles}
      />
    );
  }

  if (snapshot.game.status === "select_first_word") {
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
          isHost={isParent}
          candidates={snapshot.firstWordCandidates}
          isSelecting={isSelectingFirstWord}
          errorMessage={errorMessage}
          onSelectCandidate={selectFirstWord}
        />
      </div>
    );
  }

  if (snapshot.game.status === "player_input") {
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
          isHost={isParent}
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

  if (snapshot.game.status === "host_select") {
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
          submissionWord={currentRoundSubmission?.word ?? null}
          submissionPlayerName={currentSubmissionPlayerName}
          isHost={isRoomHost}
          errorMessage={errorMessage}
          isResolvingSelection={isResolvingSelection}
          onChooseCurrentWord={() => resolveHostSelection(true)}
          onChooseSubmission={() => resolveHostSelection(false)}
        />
      </div>
    );
  }
  if (roomSnapshot.game.status === "final_input") {
    return (
      <FinalAnswerView
        roomCode={roomCode}
        topicText={roomSnapshot.topicText}
        finalWord={roomSnapshot.game.current_word ?? ""}
        isHost={isRoomHost}
        answerDraft={finalAnswerDraft}
        hasSubmitted={hasSubmittedFinalAnswer}
        submittedCount={finalSubmissions.length}
        totalPlayers={childPlayers.length}
        isSubmitting={isSubmittingFinalAnswer}
        errorMessage={errorMessage}
        onAnswerChange={setFinalAnswerDraft}
        onSubmit={submitFinalAnswer}
      />
    );
  }
  if (roomSnapshot.game.status === "final_select") {
    return (
      <FinalSelectView
        roomCode={roomCode}
        topicText={roomSnapshot.topicText}
        initialWord={roomSnapshot.game.initial_word ?? ""}
        finalWord={roomSnapshot.game.current_word ?? ""}
        finalSubmissions={finalSubmissions}
        isHost={isRoomHost}
        isSelecting={isSelectingFinalAnswer}
        errorMessage={errorMessage}
        onSelect={selectFinalAnswer}
      />
    );
  }
  if (snapshot.game.status === "topic_result") {
    return (
      <>
        <TopicResultView
          roomCode={roomCode}
          topicText={topicText}
          initialWord={snapshot.game.initial_word ?? "未選択"}
          finalWord={snapshot.game.current_word ?? "未選択"}
          entries={topicResultEntries}
          isHost={isRoomHost}
          isProceeding={isAdvancingTopic || isFinishingGame}
          errorMessage={errorMessage}
          onNextTopic={advanceToNextTopic}
          onFinishGame={finishGame}
          selectedFinalWord={selectedFinalSubmission?.word ?? null}
          selectedFinalPlayerName={selectedFinalPlayer?.name ?? null}
        />
        <TransitionOverlay
          visible={isTransitioning}
          message={transitionMessage}
        />
      </>
    );
  }

  return (
    <FinishedView
      roomCode={roomCode}
      topicText={topicText}
      finalWord={snapshot.game.current_word ?? "未選択"}
      onReturnToRoom={leaveRoom}
    />
  );
}
