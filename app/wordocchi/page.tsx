"use client";

import { useState } from "react";
import wordocchiTopics from "@/data/wordocchiTopics.json";
import wordocchiWords from "@/data/wordocchiWords.json";
import Link from "next/link";

const shuffleArray = <T,>(items: readonly T[]): T[] => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
};


export default function WordocchiPage() {
  const [currentTopic, setCurrentTopic] = useState(wordocchiTopics[0]);
  const [history, setHistory] = useState<typeof wordocchiTopics>([]);
  const [copied, setCopied] = useState(false);
  const [remainingTopics, setRemainingTopics] = useState(() =>
    wordocchiTopics.slice(1),
  );
  const isFinished = remainingTopics.length === 0;
  const [initialWords, setInitialWords] = useState(() =>
    wordocchiWords.slice(0, 3),
  );
  const [remainingWords, setRemainingWords] = useState(wordocchiWords.slice(3));

  const updateInitialWords = () => {
      let wordPool = remainingWords;

      if (wordPool.length < 3) {
        wordPool = shuffleArray(wordocchiWords);
      }

      const nextWords = wordPool.slice(0, 3);
      const restWords = wordPool.slice(3);

      setInitialWords(nextWords);
      setRemainingWords(restWords);
    };

  const nextTopic = () => {
    setCopied(false);

    if (remainingTopics.length === 0) {
      return;
    }

    const [newTopic, ...restTopics] = remainingTopics;

    setHistory((prev) => [currentTopic, ...prev].slice(0, 5));
    setCurrentTopic(newTopic);
    updateInitialWords();
    setRemainingTopics(restTopics);
  };

  const startNewRound = () => {
    const shuffledTopics = shuffleArray(wordocchiTopics);
    const [firstTopic, ...restTopics] = shuffledTopics;

    setCurrentTopic(firstTopic);
    updateInitialWords();
    setRemainingTopics(restTopics);
    setHistory([]);
    setCopied(false);
  };

  const copyTopic = async () => {
    try {
      await navigator.clipboard.writeText(currentTopic.text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("お題のコピーに失敗しました。", error);
    }
  };

  return (
    <main className="min-h-screen bg-orange-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-orange-700 hover:underline"
          >
            ← ホームに戻る
          </Link>

          <Link
            href="/wordocchi/room"
            className="text-sm font-semibold text-orange-700 hover:underline"
          >
            オンラインで遊ぶ →
          </Link>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-600">
            お題ジェネレーター
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">ワードッチ</h1>

          <p className="mt-4 text-gray-600">
            ボタンを押すと、ワードッチで使えるお題をランダムに表示します。
          </p>

          <div className="mt-10 rounded-2xl bg-orange-100 px-6 py-12 text-center">
            <p className="text-sm text-orange-700">今回のお題</p>
            <p className="mt-2 text-sm text-orange-700">
              {wordocchiTopics.length - remainingTopics.length} /{" "}
              {wordocchiTopics.length} 問目
            </p>
            <p className="mt-4 text-3xl font-bold text-gray-900">
              {currentTopic.text}
            </p>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-bold text-gray-900">
              最初のワード候補
            </h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {initialWords.map((word) => (
                <div
                  key={word.id}
                  className="rounded-xl border border-orange-200 bg-white px-4 py-4 text-center font-semibold text-gray-800 shadow-sm"
                >
                  {word.text}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={copyTopic}
            className="mt-3 w-full rounded-2xl border-2 border-orange-500 px-6 py-3 font-bold text-orange-600 transition hover:bg-orange-50"
          >
            {copied ? "コピーしました！" : "お題をコピー"}
          </button>

          <button
            type="button"
            className="mt-6 w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600"
            onClick={isFinished ? startNewRound : nextTopic}
          >
            {isFinished ? "もう一度シャッフル" : "次のお題"}
          </button>

          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900">履歴</h2>

            <div className="mt-4 space-y-2">
              {history.map((topic) => (
                <div
                  key={topic.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 shadow-sm"
                >
                  {topic.text}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
