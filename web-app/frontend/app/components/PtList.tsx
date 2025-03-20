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
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("Access token not found in localStorage");
            navigate("/login");
        }

        const fetchPts = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/personal_trainers/", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Failed to fetch PTs");
                const data = await response.json();
                setPts(data.map((pt: any) => ({ 
                    id: pt.id, 
                    name: pt.username,
                    trainer_profile: {
                        id: pt.trainer_profile.id,
                        experience: pt.trainer_profile.experience
                    }
                })));
            } catch (error) {
                console.error("Error fetching PTs:", error);
            }
        };

        fetchPts();
    }, []);

    const newPt = async ( ptUserId: number, ptProfileId: number ) => {
        try {
            const token = localStorage.getItem("accessToken");
            const userId = localStorage.getItem("user_id");
            const username = localStorage.getItem("username"); 
            if (!token) {
                alert("Access token not found in localStorage");
                navigate("/login");
            }

            // Update user's personal trainer field, assigned PT for user. Automatically assigns the user to the PT's clients list.
            await fetch(`http://127.0.0.1:8000/user/update/${userId}/`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ profile: {personal_trainer: ptProfileId} })
            });

            // Create a chat room between the user and the PT
            const pt = pts.find(pt => pt.id === ptUserId) || null;
            if (!pt) {
                alert("Could not find PT with the given ID");
                return;
            }
            await createChatRoomWithPt(ptUserId, pt.name);
        } catch (error) {
            console.error("Error updating PT selection:", error);
        }
    };

    const createChatRoomWithPt = async (ptId: number, ptName: string) => {
        try {
            const token = localStorage.getItem("accessToken");
            await fetch("http://127.0.0.1:8000/chat_room/create/", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: `Chat with PT (Client: ${localStorage.getItem("username")}, PT: ${ptName})`,
                    participants: [Number(localStorage.getItem("user_id")), ptId]
                })
            });
        } catch (error) {
            console.error("Error creating chat room:", error);
        }
    };

    return (
        <motion.div 
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            <motion.h1
                className="text-4xl font-bold mb-6"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Select Your PT
            </motion.h1>
            <motion.div 
                className="bg-gray-800 p-8 rounded-lg shadow-md w-80"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {pts.length === 0 ? (
                    <p className="text-gray-400">No PTs available.</p>
                ) : (
                    <div className="space-y-3">
                        {pts.map(pt => (
                            <motion.div 
                                key={pt.id} 
                                className={`p-4 rounded-lg cursor-pointer flex justify-between items-center transition ${selectedPt?.id === pt.id ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`} 
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setSelectedPt(pt)}
                            >
                                <div>
                                    <h3 className="text-lg font-semibold">{pt.name}</h3>
                                    <p className="text-sm text-gray-300">🏆 Experience: {pt.trainer_profile?.experience || "N/A"}</p>
                                </div>
                                <motion.button
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
                                    whileHover={{ scale: 1.05 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPt(pt);
                                    }}
                                >
                                    Choose
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>
                )}
                {selectedPt && (
                    <>
                        <motion.div className="mt-4 p-4 bg-gray-700 rounded-lg">
                            <h3 className="text-lg font-bold">Chosen PT:</h3>
                            <p className="text-white">{selectedPt.name}</p>
                            <p className="text-gray-400">{selectedPt.trainer_profile?.experience || "N/A"}</p>
                        </motion.div>
                        <motion.button
                            className="w-full py-2 mt-4 bg-blue-600 rounded hover:bg-blue-700 transition"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => newPt(selectedPt.id, selectedPt.trainer_profile?.id || -1)}
                        >
                            Confirm PT
                        </motion.button>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

export default PtList;
