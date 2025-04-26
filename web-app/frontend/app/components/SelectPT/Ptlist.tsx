import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { backendUrl } from "~/config";

type PT = {
  id: number;
  name: string;
  trainer_profile?: {
      id: number;
      experience: string;
      pt_type: string;
  };
};

const PT_TYPE_MAP: { [key: string]: string } = {
  general: "General Fitness Trainer",
  strength: "Strength and Conditioning Trainer",
  functional: "Functional Training Coach",
  bodybuilding: "Bodybuilding Coach",
  physio: "Physical Therapist",
};

const PtList: React.FC = () => {
  const [pts, setPts] = useState<PT[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("asc");
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
              const response = await fetch(`${backendUrl}/trainer/`, {
                  headers: { Authorization: `Bearer ${token}` },
              });
              if (!response.ok) throw new Error("Failed to fetch PTs");
              const data = await response.json();
              const trainers = data.map((pt: any) => ({ 
                  id: pt.id, 
                  name: pt.username, 
                  trainer_profile: {
                      id: pt.trainer_profile.id,
                      experience: pt.trainer_profile.experience,
                      pt_type: pt.trainer_profile.pt_type,
                  }
              }));
              setPts(trainers);
          } catch (error) {
              console.error("Error fetching PTs:", error);
          }
      };
      fetchPts();
  }, [navigate]);

  // Filter and sort logic
  const filteredPts = pts
      .filter(pt =>
      pt.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterType === "all" || pt.trainer_profile?.pt_type === filterType)
      )
      .sort((a, b) => sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );
      

  const newPt = async ( ptUserId: number, ptProfileId: number ) => {
      try {
          const token = localStorage.getItem("accessToken");
          const userId = localStorage.getItem("user_id");
          if (!token) {
              alert("Access token not found in localStorage");
              navigate("/login");
          }

          const pt = pts.find(pt => pt.id === ptUserId) || null;

          if (!pt) {
              alert("Could not find PT with the given ID");
              return;
          }

          try {
              const response = await fetch(`${backendUrl}/user/${userId}/`, {
                  headers: { Authorization: `Bearer ${token}` }
              });
  
              if (!response.ok) {
                  throw new Error(`Profile fetch failed with status ${response.status}`);
              }
  
              const user = await response.json();

              if (user.profile.personal_trainer){

                  if (user.profile.personal_trainer === ptProfileId) {
                      alert(`You already have ${pt.name} as personal trainer`);
                      return;
                  }

                  // The client have someone else as their personal trainer
                  else {
                      const current_pt = pts.find(pt => pt.trainer_profile?.id === user.profile.personal_trainer)

                      const confirmSwitch = window.confirm(
                          `You already have ${current_pt?.name} as personal trainer. Are you sure you want to switch to ${pt.name}?`
                      );
                      
                      // The user chose to stay with the current personal trainer
                      if (!confirmSwitch) {
                          return;
                      }

                  }
              }
          
          } catch (err: any) {
              console.error("Error fetching profile:", err);
          }

          // Update user's personal trainer field, assigned PT for user. Automatically assigns the user to the PT's clients list.
          await fetch(`${backendUrl}/user/update/${userId}/`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ profile: {personal_trainer: ptProfileId} })
          });

          // Create a chat room between the user and the PT
          const chatRoomId = await createChatRoomWithPt(ptUserId, pt.name);
           
          // Update user's pt_chatroom field
          await fetch(`${backendUrl}/user/update/${userId}/`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ profile: {pt_chatroom: chatRoomId} })
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
          const chatRoomResponse = await fetch(`${backendUrl}/chat/create/`, {
              method: "POST",
              headers: {
                  Authorization: `Bearer ${token}`, "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  name: "Chat with PT",
                  participants: [Number(localStorage.getItem("user_id")), ptId]
              })
          });

          const chatRoomData = await chatRoomResponse.json();
          if(!chatRoomResponse.ok) {
              const fieldErrors = [];
      
              for (const key in chatRoomData) {
                if (Array.isArray(chatRoomData[key])) {
                  fieldErrors.push(`${key}: ${chatRoomData[key].join("")}`);
                } else {
                  fieldErrors.push(`${key}: ${chatRoomData[key]}`);
                }
              }
      
              alert("Chat room creation failed:\n" + fieldErrors.join("\n"));
              return;
            }
          return chatRoomData.id;


      } catch (error) {
          console.error("Error creating chat room:", error);
      }
  };

  return (

      <motion.div 
          className="min-h-screen text-white flex flex-col items-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
      >
          <motion.h1
              className="text-4xl font-bold mb-4"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5 }}
          >
              Select Your Personal Trainer
          </motion.h1>

          {/* Search and Filter Section */}
          <div className="flex flex-col w-full max-w-md mb-6 space-y-3">
              {/* Search Bar */}
              <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400"
              />
              <div className="flex space-x-4 justify-center">
                  {/* Filter Dropdown */}
                  <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
                  >
                      <option value="all">All Types</option>
                      {Object.entries(PT_TYPE_MAP).map(([key, value]) => (
                          <option key={key} value={key}>
                              {value}
                          </option>
                      ))}
                  </select>
                  {/* Sort Dropdown */}
                  <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
                  >
                      <option value="asc">A-Z</option>
                      <option value="desc">Z-A</option>
                  </select>
              </div>
          </div>

          {/* PT List */}
          <motion.div 
              className="rounded-lg w-full max-w-md space-y-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
          >
              {pts.length === 0 ? (
                  <p className="text-gray-400 text-center">No personal trainers available.</p>
              ) : filteredPts.length === 0 ? (
                  <p className="text-gray-400 text-center">No personal trainers match your search.</p>
              ) : (

                  filteredPts.map(pt => (
                      <motion.div 
                          key={pt.id} 
                          data-id={pt.id}
                          className={`p-6 rounded-lg cursor-pointer shadow-lg flex flex-col space-y-2 transition ${
                              selectedPt?.id === pt.id ? "bg-gray-700 border border-green-500" : "bg-gray-800 hover:bg-gray-700"}`} 
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedPt(selectedPt?.id === pt.id ? null : pt)}
                      >
                          <div>
                              <h3 className="text-xl font-semibold">{pt.name} - {PT_TYPE_MAP[pt.trainer_profile?.pt_type || "N/A"]}</h3>
                              <p className="text-sm text-gray-400">{pt.trainer_profile?.experience || "N/A"}</p>
                              
                              {selectedPt?.id === pt.id && (
                                  <motion.button
                                  className="w-full py-2 mt-4 bg-green-600 rounded hover:bg-green-700 transition"
                                  name="selectPtButton"
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => newPt(selectedPt.id, selectedPt.trainer_profile?.id || -1)}
                                  >
                                  Confirm Your Personal Trainer
                              </motion.button>
                              )}

                          </div>
                      </motion.div>
                  ))
          )}

          </motion.div>
      </motion.div>
  );
};

export default PtList;