"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestPage() {
  const [result, setResult] = useState("まだ実行していません");

  const testConnection = async () => {
    setResult("接続中...");

    const { data, error } = await supabase.from("games").select("*");

    if (error) {
      console.error("Supabaseエラー:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      setResult(`エラー: ${error.message}`);
      return;
    }

    setResult(`接続成功: ${JSON.stringify(data)}`);
  };

  return (
    <main className="p-10">
      <button
        type="button"
        onClick={testConnection}
        className="rounded bg-orange-500 px-6 py-3 text-white"
      >
        Supabase接続テスト
      </button>

      <p className="mt-6 text-white">{result}</p>
    </main>
  );
}