// components/SelectPT/PtList.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { backendUrl } from "~/config";

type PT = {
  id: number;
  first_name: string;
  last_name: string;
  trainer_profile: {
    id: number;
    experience: string;
  };
};

export const PtList: React.FC = () => {
  const [pts, setPts] = useState<PT[]>([]);
  const [selectedPt, setSelectedPt] = useState<PT | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Access token not found in localStorage");
      navigate("/login");
      return;
    }

    const fetchPts = async () => {
      try {
        const res = await fetch(`${backendUrl}/personal_trainers/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch PTs");
        const data = await res.json();
        setPts(
          data.map((pt: any) => ({
            id: pt.id,
            first_name: pt.first_name,
            last_name: pt.last_name,
            trainer_profile: {
              id: pt.trainer_profile.id,
              experience: pt.trainer_profile.experience,
            },
          }))
        );
      } catch (err) {
        console.error("Error fetching PTs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPts();
  }, [navigate]);

  const selectPt = async (pt: PT) => {
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("user_id");
    if (!token || !userId) {
      alert("Missing auth info");
      navigate("/login");
      return;
    }

    // 1) Set personal_trainer on profile
    await fetch(`${backendUrl}/user/update/${userId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile: { personal_trainer: pt.trainer_profile.id } }),
    });

    // 2) Create chat room
    const chatRes = await fetch(`${backendUrl}/chat_room/create/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Chat: ${localStorage.getItem("username")}↔${pt.first_name} ${pt.last_name}`,
        participants: [Number(userId), pt.id],
      }),
    });
    const chatData = await chatRes.json();

    // 3) Update pt_chatroom
    await fetch(`${backendUrl}/user/update/${userId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile: { pt_chatroom: chatData.id } }),
    });

    navigate(`/chat/${chatData.id}`);
  };

  return (
    <div className="mt-8">
      {isLoading ? (
        <motion.div
          className="text-center text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Loading trainers...
        </motion.div>
      ) : (
        <motion.div
          className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {pts.length === 0 ? (
            <p className="col-span-full text-center text-gray-400">
              No trainers available at the moment.
            </p>
          ) : (
            pts.map((pt) => (
              <motion.div
                key={pt.id}
                className={`p-4 rounded-lg cursor-pointer flex flex-col justify-between transition shadow-lg ${
                  selectedPt?.id === pt.id ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedPt(pt)}
              >
                <div>
                  <h3 className="text-xl font-semibold">
                    {pt.first_name} {pt.last_name}
                  </h3>
                  <p className="text-sm text-gray-300 mt-2">
                    🏆 Experience: {pt.trainer_profile.experience}
                  </p>
                </div>
                <motion.button
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
                  whileHover={{ scale: 1.05 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectPt(pt);
                  }}
                >
                  Choose
                </motion.button>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
};