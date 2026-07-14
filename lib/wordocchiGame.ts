import type { WordocchiTopic } from "@/data/wordocchiTopics";

export type GameStatus =
  | "waiting"
  | "select_first_word"
  | "player_input"
  | "host_select"
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
  selected: boolean;
  created_at: string;
};

export type GameRow = {
  id: string;
  room_code: string;
  game_type: string;
  status: GameStatus;
  topic_id: number | null;
  current_word: string | null;
  current_player_id: string | null;
  round_number: number;
  created_at: string;
  first_word_candidates: unknown;
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

export const buildGameStartPayload = (
  topics: readonly WordocchiTopic[],
  words: readonly WordocchiWord[],
) => {
  if (topics.length === 0) {
    throw new Error("お題が見つかりませんでした。");
  }

  if (words.length < 3) {
    throw new Error("最初のワード候補が不足しています。");
  }

  const [topic] = pickUniqueItems(topics, 1);

  return {
    topicId: topic.id,
    firstWordCandidates: pickUniqueItems(words, 3).map((word) => ({
      id: word.id,
      text: word.text,
    })),
  };
};

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
