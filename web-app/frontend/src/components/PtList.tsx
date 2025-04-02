import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type PT = {
  id: number;
  name: string;
  trainer_profile?: {
    id: number;
    experience: string;
  };
};

const PtList: React.FC = () => {
  const [pts, setPts] = useState<PT[]>([]);
  const [selectedPt, setSelectedPt] = useState<PT | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
        const response = await fetch("http://127.0.0.1:8000/personal_trainers/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch PTs");
        const data = await response.json();
        setPts(
          data.map((pt: any) => ({
            id: pt.id,
            name: pt.username,
            trainer_profile: {
              id: pt.trainer_profile.id,
              experience: pt.trainer_profile.experience,
            },
          }))
        );
      } catch (error) {
        console.error("Error fetching PTs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPts();
  }, [navigate]);

  const newPt = async (ptUserId: number, ptProfileId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("user_id");
      if (!token || !userId) {
        alert("Access token or user id not found in localStorage");
        navigate("/login");
        return;
      }

      // Update user's personal trainer field
      await fetch(`http://127.0.0.1:8000/user/update/${userId}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { personal_trainer: ptProfileId } }),
      });

      // Create a chat room between the user and the PT
      const pt = pts.find(pt => pt.id === ptUserId) || null;
      if (!pt) {
        alert("Could not find PT with the given ID");
        return;
      }
      const chatRoomId = await createChatRoomWithPt(ptUserId, pt.name);

      // Update user's pt_chatroom field
      await fetch(`http://127.0.0.1:8000/user/update/${userId}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { pt_chatroom: chatRoomId } }),
      });
      alert("PT selection successful!");
      navigate("/chat/" + chatRoomId);
    } catch (error) {
      console.error("Error updating PT selection:", error);
    }
  };

  const createChatRoomWithPt = async (ptId: number, ptName: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const chatRoomResponse = await fetch("http://127.0.0.1:8000/chat_room/create/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Chat with PT (Client: ${localStorage.getItem("username")}, PT: ${ptName})`,
          participants: [Number(localStorage.getItem("user_id")), ptId],
        }),
      });

      const chatRoomData = await chatRoomResponse.json();
      return chatRoomData.id;
    } catch (error) {
      console.error("Error creating chat room:", error);
    }
  };

  return (
    <div className="mt-8">
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-lg text-gray-300">
          Browse through our available personal trainers below and select the one that best suits your needs.
        </p>
      </motion.div>
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
            pts.map(pt => (
              <motion.div
                key={pt.id}
                className={`p-4 rounded-lg cursor-pointer flex flex-col justify-between transition shadow-lg ${
                  selectedPt?.id === pt.id ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedPt(pt)}
              >
                <div>
                  <h3 className="text-xl font-semibold">{pt.name}</h3>
                  <p className="text-sm text-gray-300 mt-2">
                    🏆 Experience: {pt.trainer_profile?.experience || "N/A"}
                  </p>
                </div>
                <motion.button
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
                  whileHover={{ scale: 1.05 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPt(pt);
                  }}
                >
                  Choose
                </motion.button>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
      {selectedPt && (
        <motion.div
          className="mt-10 p-6 bg-gray-800 rounded-lg shadow-md max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-2xl font-bold mb-2">Your Selected Trainer</h3>
          <p className="text-xl text-white mb-1">{selectedPt.name}</p>
          <p className="text-gray-400 mb-4">
            Experience: {selectedPt.trainer_profile?.experience || "N/A"}
          </p>
          <motion.button
            className="w-full py-3 bg-blue-600 rounded hover:bg-blue-700 transition"
            whileHover={{ scale: 1.05 }}
            onClick={() => newPt(selectedPt.id, selectedPt.trainer_profile?.id || -1)}
          >
            Confirm PT
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default PtList;