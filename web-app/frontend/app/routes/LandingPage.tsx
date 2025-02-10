import { useState } from "react";
import { Link } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";

export default function LandingPage() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  return (
    <>
      {!loadingComplete && <LoadingScreen onComplete={() => setLoadingComplete(true)} />}
      {loadingComplete && (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white">
          <h1 className="text-6xl font-extrabold mb-6">GymApp 💪</h1>
          <p className="text-xl mb-8">Transform Your Fitness Journey Today!</p>
          <div className="flex space-x-4">
            <Link to="/login">
              <button className="px-6 py-3 bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition">
                Login
              </button>
            </Link>
            <Link to="/register">
              <button className="px-6 py-3 bg-green-600 rounded-lg shadow hover:bg-green-700 transition">
                Register
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}