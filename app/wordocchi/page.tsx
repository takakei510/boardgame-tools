"use client";

import { useState } from "react";
import { wordocchiTopics } from "@/data/wordocchiTopics";
import Link from "next/link";

export default function WordocchiPage() {
  const [currentTopic, setCurrentTopic] = useState(wordocchiTopics[0]);

    const nextTopic = () => {
    let newTopic = currentTopic;

    while (newTopic.id === currentTopic.id && wordocchiTopics.length > 1) {
        const randomIndex = Math.floor(
        Math.random() * wordocchiTopics.length
        );

        newTopic = wordocchiTopics[randomIndex];
    }

    setCurrentTopic(newTopic);
    };

  return (
    <main className="min-h-screen bg-orange-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/"
          className="text-sm font-semibold text-orange-700 hover:underline"
        >
          ← ホームに戻る
        </Link>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-600">
            お題ジェネレーター
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            ワードッチ
          </h1>

          <p className="mt-4 text-gray-600">
            ボタンを押すと、ワードッチで使えるお題をランダムに表示します。
          </p>

          <div className="mt-10 rounded-2xl bg-orange-100 px-6 py-12 text-center">
            <p className="text-sm text-orange-700">今回のお題</p>

            <p className="mt-4 text-3xl font-bold text-gray-900">
              {currentTopic.text}
            </p>
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600"
            onClick={nextTopic}
          >
            次のお題
          </button>
        </section>
      </div>
    </main>
  );
}