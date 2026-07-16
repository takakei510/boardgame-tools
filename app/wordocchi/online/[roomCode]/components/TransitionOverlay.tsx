type TransitionOverlayProps = {
  visible: boolean;
  message?: string;
};

export default function TransitionOverlay({
  visible,
  message = "次の画面を準備しています…",
}: TransitionOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/35 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />

        <p className="mt-5 text-lg font-bold text-gray-900">
          {message}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          そのままお待ちください。
        </p>
      </div>
    </div>
  );
}