import { useEffect, useState } from "react";

export const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [text, setText] = useState("");
  const fullText = "Welcome to GymApp";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, index));
      index++;

      if (index > fullText.length) {
        clearInterval(interval);
        // Wait briefly before finishing
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 80); // Faster interval for smoother animation

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center">
      <div className="mb-8 text-5xl font-extrabold tracking-tight">
        {text} <span className="animate-pulse">|</span>
      </div>
      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden shadow-lg">
        {/* The progress bar can be animated via Tailwind’s built-in or custom animations */}
        <div className="h-full bg-blue-600 animate-[loadingBar_2s_linear_infinite]"></div>
      </div>
    </div>
  );
};