// src/components/LandingPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  return (
    <>
      {!loadingComplete && (
        <LoadingScreen onComplete={() => setLoadingComplete(true)} />
      )}
      {loadingComplete && (
        <motion.div
          className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white"
          style={{ backgroundColor: "#1F2937" }}
          initial={{ opacity: 1}}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-6xl font-extrabold mb-6"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8 }}
          >
            iGym 💪
          </motion.h1>
          <motion.p
            className="text-xl mb-8"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Transform Your Fitness Journey Today!
          </motion.p>
          <motion.div
            className="flex space-x-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/login">
              <motion.button
                name="loginButton"
                className="px-6 py-3 bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition"
                whileHover={{ scale: 1.03 }}
              >
                Login
              </motion.button>
            </Link>
            <Link to="/register">
              <motion.button
                name="registrationButton"
                className="px-6 py-3 bg-green-600 rounded-lg shadow hover:bg-green-700 transition"
                whileHover={{ scale: 1.03 }}
              >
                Register
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}