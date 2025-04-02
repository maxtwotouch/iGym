import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [text, setText] = useState("");
  const fullText = "Welcome to iGym";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="mb-8 text-5xl font-extrabold tracking-tight"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {text} <span className="animate-pulse">|</span>
      </motion.div>
      <motion.div
        className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden shadow-lg"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 2, ease: "linear" }}
      >
        <div className="h-full bg-blue-600"></div>
      </motion.div>
    </motion.div>
  );
};