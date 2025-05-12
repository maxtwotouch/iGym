import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { backendUrl } from "~/config";
import defaultProfilePicture from "~/assets/defaultProfilePicture.jpg";

import apiClient from "~/utils/api/apiClient";
import { useAuth } from "~/context/AuthContext";

import type { PT } from "~/types"; // Import types for workouts and exercises

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
  const { user, updateUserContext } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get("/trainer/")
      .then((res) => {
        if (res.status != 200) throw new Error();
        return res.data;
      })
      .then((data) => {
        const trainers: PT[] = data.map((pt: any) => ({
          id: pt.id,
          username: pt.username,
          first_name: pt.first_name,
          last_name: pt.last_name,
          trainer_profile: {
            id: pt.trainer_profile.id,
            experience: pt.trainer_profile.experience,
            pt_type: pt.trainer_profile.pt_type,
            profile_picture: pt.trainer_profile.profile_picture,
          },
        }));
        setPts(trainers);
      })
      .catch((e) => console.error("Failed to load PTs", e));
  }, []);

  // Filter and sort logic
  const filteredPts = pts
    .filter((pt) => {
      const matchesName = pt.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || pt.trainer_profile?.pt_type === filterType;
      return matchesName && matchesType;
    })
    .sort((a, b) =>
      sortOrder === "asc" ? a.username.localeCompare(b.username) : b.username.localeCompare(a.username)
    );
      

  const newPt = async ( ptUserId: number, ptProfileId: number ) => {
      try {
          const pt = pts.find(pt => pt.id === ptUserId) || null;

          if (!pt) {
              alert("Could not find PT with the given ID");
              return;
          }

          try {
              if (user?.profile.personal_trainer){
                  if (user.profile.personal_trainer === ptProfileId) {
                      alert(`You already have ${pt.username} as personal trainer`);
                      return;
                  }

                  // The client have someone else as their personal trainer
                  else {
                      const current_pt = pts.find(pt => pt.trainer_profile?.id === user.profile.personal_trainer)

                      const confirmSwitch = window.confirm(
                          `You already have ${current_pt?.username} as personal trainer. Are you sure you want to switch to ${pt.username}?`
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
          await apiClient.patch(`/user/update/${user?.userId}/`, {
              profile: {personal_trainer: ptProfileId}})

          // Create a chat room between the user and the PT
          const chatRoomId = await createChatRoomWithPt(ptUserId, pt.username, user?.username || "Client");
           
          // Update user's pt_chatroom field
          await apiClient.patch(`/user/update/${user?.userId}/`, {
              profile: {pt_chatroom: chatRoomId}});
          alert("PT selection successful!");
          // Update user context
          await updateUserContext();

          navigate("/chat/" + chatRoomId);
      } 
      catch (error) {
        console.error("Error updating PT selection:", error);
      }
  };

  const createChatRoomWithPt = async (ptId: number, ptName: string, clientName: string) => {
      try {
          const chatRoomResponse = await apiClient.post(`/chat/create/`, {
            name: "PT - " + ptName + " X Client - " + clientName,
            participants: [Number(user?.userId), ptId]
          });

          const chatRoomData = await chatRoomResponse.data;
          if(chatRoomResponse.status !== 201) {
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

          <p className="text-lg text-gray-300 mb-6 text-center">
              Discover a trainer who perfectly matches your style and goals. Browse our curated list and choose the best fit for you.
          </p>

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
                      className="flex-1 p-2 rounded-lg border border-gray-600 bg-gray-700 text-white cursor-pointer"
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
                      className="flex-1 p-2 rounded-lg border border-gray-600 bg-gray-700 text-white cursor-pointer"
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
                          className={`p-6 rounded-lg cursor-pointer shadow-lg flex flex-col space-y-2 transition-all duration-300 ${
                              selectedPt?.id === pt.id 
                              ? "bg-gray-700 transform scale-105" 
                              : "bg-gray-800 hover:bg-gray-700"}`} 
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedPt(selectedPt?.id === pt.id ? null : pt)}
                      >
                        <div className="flex flex-row justify-between items-center space-x-4">
                          <div className="flex flex-1 flex-col space-y-2">
                                <h3 className="text-2xl font-bold text-white">
                                    {pt.first_name} {pt.last_name}
                                </h3>
                                <span className="text-xs font-semibold rounded-lg text-gray-300">
                                    {PT_TYPE_MAP[pt.trainer_profile?.pt_type || "N/A"]}
                                </span>
                                <p className="text-sm text-gray-400">{pt.trainer_profile?.experience || "N/A"}</p>
                            </div>
                            <div className="w-28 h-28 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-600">
                              <img 
                                  src={pt.trainer_profile?.profile_picture || defaultProfilePicture}
                                  alt=""
                                  className="w-full h-full object-cover"
                              />
                            </div>
                        </div>            
                              {selectedPt?.id === pt.id && (
                                  <motion.button
                                  className="w-full py-3 mt-4 bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-lg cursor-pointer"
                                  name="selectPtButton"
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => newPt(selectedPt.id, selectedPt.trainer_profile?.id || -1)}
                                  >
                                  <span className="flex items-center justify-center space-x-2">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                      </svg>
                                      <span>Confirm Your Personal Trainer</span>
                                  </span>
                              </motion.button>
                              )}    

                      </motion.div>
                  ))
          )}

          </motion.div>
      </motion.div>
  );
};

export default PtList;