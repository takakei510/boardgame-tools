import type { WordocchiTopic } from "@/data/wordocchiTopics";

export type GameStatus =
  | "waiting"
  | "select_first_word"
  | "player_input"
  | "host_select"
  | "topic_result"
  | "finished";

export type FirstWordCandidate = {
  id: number;
  text: string;
};

export type WordocchiWord = {
  id: number;
  text: string;
};

export type PlayerRow = {
  id: string;
  game_id: string;
  name: string;
  is_host: boolean;
  join_order: number;
  connected: boolean;
};

export type SubmissionRow = {
  id: string;
  game_id: string;
  player_id: string;
  word: string;
  round_number: number;
  topic_round: number;
  answer_phase: "normal" | "final";
  cycle_number: number;
  selected: boolean;
  created_at: string;
};

export type GameRow = {
  id: string;
  room_code: string;
  game_type: string;
  status: GameStatus;
  topic_id: number | null;
  topic_round: number;
  initial_word: string | null;
  current_word: string | null;
  current_player_id: string | null;
  round_number: number;
  created_at: string;
  first_word_candidates: unknown;
  used_topic_ids: unknown;
  answer_cycles: number;
  current_cycle: number;
};

export type GameStartPayload = {
  topicId: number;
  firstWordCandidates: FirstWordCandidate[];
  usedTopicIds: number[];
};

export type StartNextTopicPayload = {
  topicId: number;
  firstWordCandidates: FirstWordCandidate[];
  usedTopicIds: number[];
};

export const normalizeFirstWordCandidates = (
  value: unknown,
): FirstWordCandidate[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((candidate) => {
      if (
        typeof candidate === "object" &&
        candidate !== null &&
        "id" in candidate &&
        "text" in candidate
      ) {
        const id = Number((candidate as { id: unknown }).id);
        const text = String((candidate as { text: unknown }).text);

        if (Number.isNaN(id) || text.trim() === "") {
          return null;
        }

        return { id, text };
      }

      return null;
    })
    .filter((candidate): candidate is FirstWordCandidate => candidate !== null);
};

export const normalizeNumericJsonArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
};

const shuffleArray = <T,>(items: readonly T[]): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

const pickUniqueItems = <T,>(items: readonly T[], count: number): T[] => {
  return shuffleArray(items).slice(0, count);
};

export const pickRandomWords = (
  words: readonly WordocchiWord[],
  count = 3,
): FirstWordCandidate[] => {
  return pickUniqueItems(words, count).map((word) => ({
    id: word.id,
    text: word.text,
  }));
};

export const pickUnusedTopic = (
  topics: readonly WordocchiTopic[],
  usedTopicIds: unknown,
) => {
  const normalizedUsedTopicIds = [...new Set(normalizeNumericJsonArray(usedTopicIds))];
  const unusedTopics = topics.filter(
    (topic) => !normalizedUsedTopicIds.includes(topic.id),
  );
  const sourceTopics = unusedTopics.length > 0 ? unusedTopics : topics;
  const [topic] = pickUniqueItems(sourceTopics, 1);

  if (!topic) {
    throw new Error("お題が見つかりませんでした。");
  }

  const nextUsedTopicIds =
    unusedTopics.length > 0 ? [...normalizedUsedTopicIds, topic.id] : [topic.id];

  return {
    topic,
    usedTopicIds: nextUsedTopicIds,
  };
};

export const startGame = (
  topics: readonly WordocchiTopic[],
  words: readonly WordocchiWord[],
) : GameStartPayload => {
  const { topic, usedTopicIds } = pickUnusedTopic(topics, []);

  if (words.length < 3) {
    throw new Error("最初のワード候補が不足しています。");
  }

  return {
    topicId: topic.id,
    firstWordCandidates: pickRandomWords(words, 3),
    usedTopicIds,
  };
};

export const selectFirstWord = (
  firstWord: FirstWordCandidate,
  firstAnsweringPlayer: PlayerRow | null,
) => {
  if (!firstAnsweringPlayer) {
    throw new Error("回答する子プレイヤーが見つかりませんでした。");
  }

  return {
    initial_word: firstWord.text,
    current_word: firstWord.text,
    current_player_id: firstAnsweringPlayer.id,
    round_number: 1,
    status: "player_input" as const,
  };
};

export const submitWord = (
  gameId: string,
  playerId: string,
  word: string,
  roundNumber: number,
  topicRound: number,
  cycleNumber: number,
) => ({
  game_id: gameId,
  player_id: playerId,
  word,
  round_number: roundNumber,
  topic_round: topicRound,
  answer_phase: "normal" as const,
  cycle_number: cycleNumber,
  selected: false,
});

export const getNextUnansweredPlayer = (
  players: PlayerRow[],
  submissions: SubmissionRow[],
  topicRound: number,
  currentCycle: number,
): PlayerRow | null => {
  const childPlayers = [...players]
    .filter((player) => !player.is_host)
    .sort((left, right) => left.join_order - right.join_order);

  const answeredPlayerIds = new Set(
    submissions
      .filter(
        (submission) =>
          submission.topic_round === topicRound &&
          submission.answer_phase === "normal" &&
          submission.cycle_number === currentCycle,
      )
      .map((submission) => submission.player_id),
  );

  return (
    childPlayers.find((player) => !answeredPlayerIds.has(player.id)) ?? null
  );
};

export const selectWinningWord = (
  selectedSubmission: SubmissionRow | null,
  currentWord: string | null,
  nextPlayer: PlayerRow | null,
  nextRoundNumber: number,
) => {
  if (nextPlayer) {
    return {
      current_word: selectedSubmission?.word ?? currentWord,
      current_player_id: nextPlayer.id,
      round_number: nextRoundNumber,
      status: "player_input" as const,
    };
  }

  return {
    current_word: selectedSubmission?.word ?? currentWord,
    current_player_id: null,
    round_number: nextRoundNumber,
    status: "topic_result" as const,
  };
};

export const startNextTopic = (
  topics: readonly WordocchiTopic[],
  words: readonly WordocchiWord[],
  usedTopicIds: unknown,
  currentTopicId: number | null,
  currentTopicRound: number,
) => {
  const nextUsedTopicIds =
    currentTopicId === null
      ? normalizeNumericJsonArray(usedTopicIds)
      : [...normalizeNumericJsonArray(usedTopicIds), currentTopicId];

  const { topic, usedTopicIds: normalizedUsedTopicIds } = pickUnusedTopic(
    topics,
    nextUsedTopicIds,
  );

  return {
    topicId: topic.id,
    firstWordCandidates: pickRandomWords(words, 3),
    usedTopicIds: normalizedUsedTopicIds,
    initial_word: null as string | null,
    current_word: null as string | null,
    current_player_id: null as string | null,
    round_number: 0,
    topic_round: currentTopicRound + 1,
    status: "select_first_word" as const,
  };
};

export const finishGame = () => ({
  status: "finished" as const,
});

export const getFirstAnsweringPlayer = (
  players: PlayerRow[],
): PlayerRow | null => {
  const nonHostPlayers = [...players]
    .filter((player) => !player.is_host)
    .sort((left, right) => left.join_order - right.join_order);

  return nonHostPlayers[0] ?? null;
};

export const getNextAnsweringPlayer = (
  players: PlayerRow[],
  currentPlayerId: string | null,
): PlayerRow | null => {
  const nonHostPlayers = [...players]
    .filter((player) => !player.is_host)
    .sort((left, right) => left.join_order - right.join_order);

  if (nonHostPlayers.length === 0) {
    return null;
  }

  if (!currentPlayerId) {
    return nonHostPlayers[0] ?? null;
  }

  const currentIndex = nonHostPlayers.findIndex(
    (player) => player.id === currentPlayerId,
  );

  if (currentIndex === -1) {
    return nonHostPlayers[0] ?? null;
  }

  return nonHostPlayers[(currentIndex + 1) % nonHostPlayers.length] ?? null;
};

export const findSubmissionForRound = (
  submissions: SubmissionRow[],
  roundNumber: number,
): SubmissionRow | null => {
  const [submission] = [...submissions]
    .filter((item) => item.round_number === roundNumber)
    .sort((left, right) => {
      if (left.selected === right.selected) {
        return left.created_at.localeCompare(right.created_at);
      }

      return Number(right.selected) - Number(left.selected);
    });

  return submission ?? null;
};

export const getSubmissionsForTopicRound = (
  submissions: SubmissionRow[],
  topicRound: number,
) => {
  return [...submissions]
    .filter((submission) => submission.topic_round === topicRound)
    .sort((left, right) => left.round_number - right.round_number);
};
