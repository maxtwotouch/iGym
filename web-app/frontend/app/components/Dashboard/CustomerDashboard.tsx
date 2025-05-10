import React, { useState, useRef, useEffect, use } from "react";
import { useNavigate, useLoaderData } from "react-router";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

import apiClient from "~/utils/api/apiClient";
import ChatRoom from "../Chat/ChatRoom";

import type { Workout, Exercise, WorkoutSession, ExerciseSession, Set, User, Notification, chatRoom, PT } from "~/types"; // Import types for workouts and exercises

import { deleteWorkout } from "~/utils/api/workouts";

import { useAuth } from "~/context/AuthContext";

import defaultProfilePicture from "~/assets/defaultProfilePicture.jpg";


const PT_TYPE_MAP: { [key: string]: string } = {
  general: "General Fitness Trainer",
  strength: "Strength and Conditioning Trainer",
  functional: "Functional Training Coach",
  bodybuilding: "Bodybuilding Coach",
  physio: "Physical Therapist",
};

export const CustomerDashboard: React.FC = () => {
    const loaderData = useLoaderData<{
        workoutSessions: WorkoutSession[];
        workouts: Workout[];
        exercises: Exercise[];
        userType: string;
    }>();

    const [workouts, setWorkouts] = useState<Workout[]>(loaderData?.workouts || []);
    const exercises: Exercise[] = loaderData?.exercises || [];
    const workoutSessions: WorkoutSession[] = loaderData?.workoutSessions || [];
    const [trainer, setTrainer] = useState<PT | null>(null);
    const [roomId, setRoomId] = useState<number | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [uniqueNotifications, setUniqueNotifications] = useState<Notification[]>([]);
    const [chatRooms, setChatRooms] = useState<chatRoom[]>([]);
    const [chatRoomVisible, setChatRoomVisible] = useState(false);
    const [showAllPreviousSessions, setShowAllPreviousSessions] = useState(false);
    const socketsRef = useRef<Map<number, WebSocket>>(new Map());
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchUserChatRooms = async () => {
            try {
              const chatRoomsResponse = await apiClient.get("/chat/");
              const chatRoomsData = chatRoomsResponse.data;
              setChatRooms(chatRoomsData);
            } catch (error) {
              console.error("Error fetching chat rooms:", error);
            }
          }

          const fetchTrainer = async () => {
            try {
              const userResponse = await apiClient.get(`/user/${user?.userId}/`);
              const userData = await userResponse.data;
      
              // Fetch all trainers
              const trainersResponse = await apiClient.get("/trainer/");
              const trainerData = await trainersResponse.data;
      
              // Map trainers
              const trainers: PT[] = trainerData.map((pt: any) => ({
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
      
              // Find the trainer that matches the user's personal trainer
              const matchedTrainer = trainers.find(
                  (trainer: any) => trainer.trainer_profile.id === userData.profile.personal_trainer
              );
      
              if (matchedTrainer) {
                  setTrainer(matchedTrainer);
              }
          } catch (error) {
              console.error("Error fetching trainer data:", error);
          }
      };

          const fetchChatRoomPt = async () => {
            try {
              const userResponse = await apiClient.get(`/user/${user?.userId}/`);
              const userData = await userResponse.data;
              const roomId = userData.profile.pt_chatroom;
              setRoomId(roomId);
            } catch (error) {
              console.error("Error fetching chat room data:", error);
            }
          };

          const notificationsList = async () => {
            try {
              const notificationsUserResponse = await apiClient.get("/notification/");
              const notificationsUserData = await notificationsUserResponse.data;
              notificationsUserData.map((notification: any) => {
                setNotifications((prev) => [...prev, {
                  id: notification.id,
                  sender: notification.sender,
                  chat_room_id: notification.chat_room_id,
                  chat_room_name: notification.chat_room_name,
                  date_sent: new Date(notification.date_sent),
                  message: notification.message || null,
                  workout_message: notification.workout_message?.name || null,
                }]);
              });
            } catch (error) {
              console.error("Error fetching notifications:", error);
            }
          }

          fetchTrainer();
          fetchChatRoomPt();
          notificationsList();
          fetchUserChatRooms();
      
    }, [navigate]);

  // Connect to WebSocket, listen for notifications from chat rooms
  useEffect(() => {
    if (chatRooms.length === 0) return; 

    const roomIds = chatRooms.map((room) => room.id); // Room IDs which User is participant of

    roomIds.forEach(async (idRoom) => {
      const existingSocket = socketsRef.current.get(idRoom);
      if (existingSocket) { // Close existing WebSocket connection, for the same chat room
        existingSocket.close();
      }

      if (!idRoom || typeof idRoom !== "number") {
        console.warn("Invalid room id:", idRoom);
        return;
      }

      const socket = await apiClient.createSocket(idRoom); // Create a new WebSocket connection
      socketsRef.current.set(idRoom, socket);

      socket.onmessage = (event) => {{ 
        const notification = JSON.parse(event.data); 

        if (notification.type === "notification") {
          const newNotification: Notification = {
            id: notification.id,
            sender: notification.sender,
            chat_room_id: notification.chat_room_id,
            chat_room_name: notification.chat_room_name,
            date_sent: new Date(notification.date_sent),
            message: notification.message || null,
            workout_message: notification.workout?.name || null,
          };

          if (notification.sender == user?.username) {
            return;
          }

          setNotifications((prev) => [...prev, newNotification]);
        }
      }};

      socket.onclose = () => { 
        socketsRef.current.delete(idRoom);
      };
    });

    return () => { // Close all WebSockets when the user exits the dashboard
        socketsRef.current.forEach((socket) => {
          socket.close();
        });
    };
  }, [chatRooms]);

 	// Filter out duplicate notifications (notifications from the same chat room, only show the most recent one)
 	useEffect(() => {
        const sortedNotifications = [...notifications].sort( // Sort notifications by date sent, only want the most recent from each chat room
          (a, b) => b.date_sent.getTime() - a.date_sent.getTime()
        );
    
        const seenChatRoom = new Set<number>();
        const tempUnique: Notification[] = [];
    
        for (const notification of sortedNotifications) {
          if (!seenChatRoom.has(notification.chat_room_id)) {
            seenChatRoom.add(notification.chat_room_id);
            tempUnique.push(notification);
          }
        }
        setUniqueNotifications(tempUnique);
      }, [notifications]);
    
          // Delete all notifications form the chat room and navigate to the chat room
        const handleNotificationClick = async (chatRoomId: number) => {
            try {
                // Deleting every notification from the chat room for the current user
                notifications.forEach(async (notification) => {
                    if (notification.chat_room_id === chatRoomId) {
                        apiClient.delete(`/notification/delete/${notification.id}/`);
                    }
                });
            } catch (error) {
                console.error("Error deleting notification:", error);
            }
    
            navigate(`/chat/${chatRoomId}`);  
        };

        const formatTimeAgo = (date: Date) => {
            const now = new Date();
            date = new Date(date);
            const diff = (now.getTime() - date.getTime()) / 1000; // Difference in seconds, getTime defaults to milliseconds
    
            if (diff < 60) return `${Math.floor(diff)}s ago`; // Less than a minute
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; // Less than an hour
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; // Less than a day
            if (diff > 86400) return `${Math.floor(diff / 86400)}d ago`; // Days ago
        };

        const handleDeleteWorkout = async (workoutId: number) => {
          try {
            await deleteWorkout(workoutId); 
            setWorkouts(prevWorkouts => prevWorkouts.filter(w => w.id !== workoutId));
          } catch (error) {
            console.error("Failed to delete workout from dashboard:", error);
            alert("Could not delete the workout. Please try again.");
          }
        };

    return (
        <motion.div
        className="flex flex-col flex-grow bg-gray-900 text-white p-4 gap-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        >
        {/* Greeting */}
        <motion.div
            className="w-full text-center mb-2"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.h1 className="text-4xl font-bold">
            Dashboard
            </motion.h1>
        </motion.div>

        {/* Dashboard layout */}
        <motion.div className="flex flex-row flex-grow gap-x-6 w-full">
            {/* Left section: Notifications and Personal Trainer */}
            <motion.div
            className="bg-gray-800 p-6 rounded shadow-lg flex flex-col items-center text-center w-full md:w-1/4"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            >
            {/* Notifications */}
            <motion.div>
                <motion.h3
                className="text-xl font-bold mb-6"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                >
                Notifications
                </motion.h3>

              <motion.ul
                className="p-2 rounded-xl w-full space-y-2"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {uniqueNotifications.map((notif) => (
                  <motion.li
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.chat_room_id)}
                    className="p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer w-full"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center mb-1">
                      <div className="flex-1 flex items-center min-w-0">
                        <span className="mr-1 flex-shrink-0">📩</span>
                        <span className="font-medium text-xs flex-shrink-0">{notif.sender}</span>
                        <span className="mx-1 text-gray-400 flex-shrink-0">•</span>
                        <span className="mr-1 flex-shrink-0">👥</span>
                        <span className="font-medium text-xs truncate">{notif.chat_room_name}</span>
                      </div>
                      <div className="text-xs text-gray-400 break-words ml-1 flex-shrink-0">
                        <span className="mr-1">⏱️</span>
                        {formatTimeAgo(notif.date_sent)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 break-words">
                      {notif.message || (notif.workout_message && `🏋️‍♂️ ${notif.workout_message}`)}
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            {/* Personal Trainer Card */}
            {trainer && roomId && (
                <motion.div className="w-full mt-4">
                <h2 className="text-xl font-bold mb-4">My Personal Trainer</h2>

                  <motion.div className="flex items-center justify-center space-x-4">
                    <div className="w-17 h-17 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-600">
                        <img 
                          src={trainer.trainer_profile?.profile_picture || defaultProfilePicture}
                          alt=""
                          className="w-full h-full object-cover"
                          />
                    </div>
                      <div className="flex flex-col space-y-1 items-start">
                      <h3 className="text-lg font-semibold">
                        {trainer.first_name} {trainer.last_name} 
                      </h3>
                      <span className="text-xs font-semibold rounded-lg text-gray-300">
                          {PT_TYPE_MAP[trainer.trainer_profile?.pt_type || "N/A"]}
                      </span>

                      </div>

                      <motion.button
                        // Toggle chat room visibility
                        onClick={() => setChatRoomVisible(!chatRoomVisible)}
                        className="flex items-center justify-center rounded-full p-2 bg-blue-500 hover:bg-blue-600 cursor-pointer"
                        whileHover={{ scale: 1.1 }}
                        initial={false}
                        animate={{ scale: chatRoomVisible ? 1.1 : 1 }}
                      >
                        {/* Chat icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 text-white"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M2 5a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H6l-4 4V5z" />
                        </svg>
                      </motion.button>
                    </motion.div>
                </motion.div>
            )}

            {/* Get a Personal Trainer if it is not already assigned */}
            {!trainer && (
                <motion.div>
                <h2 className="text-xl font-bold mb-4">My Personal Trainer</h2>
                <p className="text-gray-400">You do not have a personal trainer yet.</p>
                <motion.button
                    onClick={() => navigate("/personalTrainers")}
                    className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded"
                    whileHover={{ scale: 1.05 }}
                >
                    Find a personal trainer
                </motion.button>
                </motion.div>
            )}
            </motion.div>
    
            {/* Main Panel: Middle + Right sections or Chat Room */}
            {/* Check if the user has opened the chat room */}
            <AnimatePresence mode="wait">
                {chatRoomVisible ? (
                <motion.div
                    key="chatRoom"
                    className="flex flex-col text-center flex-[3]"
                    initial={{ opacity: 0, scale: 0.9, x: -50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -50 }}
                    transition={{ duration: 0.5 }}
                >          
                <div className="">
                  {/* X Button to Exit Chat Room */}
                  <motion.button
                      onClick={() => setChatRoomVisible(false)}
                      className="text-white text-2xl rounded-full cursor-pointer absolute right-10"
                      aria-label="Close Chat Room"
                      whileHover={{ scale: 1.1 }}
                  >
                      ✕
                  </motion.button>
                </div>
                { /* Chat Room Component */}
                <ChatRoom chatRoomId={roomId ?? -1} onLeave={() => setRoomId(null)} />
                </motion.div>
                ) : (
                
                <motion.div
                    key="dashboardContent"
                    className="flex flex-row gap-x-6 flex-[3]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Middle section: Workout Feed */}
                    <motion.div className="p-6 rounded flex flex-col items-center flex-[2]">
                        <h3 className="text-xl font-bold mb-4 text-center">Previous Workout Sessions</h3>
    
                        {workoutSessions.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center">No History</p>
                        ) : (
                        <div className="space-y-4 w-full">
                            {workoutSessions
                                .slice() 
                                .reverse()
                                .slice(0, showAllPreviousSessions ? undefined : 2) 
                                .map((session) => {
                            const workout = workouts.find((w) => w.id === session.workout);
                            const workoutName = workout ? workout.name : "Unknown Workout";
    
                            return (
                                <div
                                key={session.id}
                                className="p-2 bg-gray-800 rounded hover:bg-gray-700 flex flex-col"
                                >
                                <p className="font-semibold text-xl mb-3">💪 {workoutName}</p>
                                <div className="flex flex-col">
                                    <p className="text-sm text-gray-400 mt-1 mb-0">
                                    🔥 Calories Burned:{" "}
                                    <span className="font-semibold text-white">{Math.round(session.calories_burned)}</span>
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1 mb-0">
                                    📅 Date performed:{" "}
                                    <span className="font-semibold text-white">
                                        {new Date(session.start_time).toLocaleDateString("en-GB", {
                                        weekday: "short",
                                        year: "numeric",
                                        month: "short",
                                        day: "2-digit",
                                        })}
                                    </span>
                                    </p>
                                </div>
                                <div className="mt-3">
                                    <div className="mt-2">
                                    {session.exercise_sessions.map((exerciseSession) => {
                                        const exercise = exercises.find((ex) => ex.id === exerciseSession.exercise);
                                        const exerciseName = exercise ? exercise.name : "Unknown Exercise";
    
                                        return (
                                        <div key={exerciseSession.id} className="mb-2">
                                            <p className="text-white font-semibold">{exerciseName}</p>
                                            <div className="ml-4 text-sm text-gray-400">
                                            {exerciseSession.sets.map((set, index) => (
                                                <div key={set.id} className="flex justify-between">
                                                <span>Set {index + 1}: </span>
                                                <span className="font-semibold text-white">{set.repetitions} reps</span>
                                                <span className="font-semibold text-white">{set.weight} kg</span>
                                                </div>
                                            ))}
                                            </div>
                                        </div>
                                        );
                                    })}
                                    </div>
                                </div>
                                </div>
                            );
                            })}
                        </div>
                        )}
                        {/* Show more button */}
                        {workoutSessions.length > 2 && !showAllPreviousSessions && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            name="showMoreButton"
                            onClick={() => setShowAllPreviousSessions((prev) => !prev)}
                            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white text-base cursor-pointer"
                          >
                            {"Show More"}
                          </motion.button>
                        )}

                        {/* Show less button (sticky bottom) */}
                        {showAllPreviousSessions && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            name="hidePreviousSessionsButton"
                            onClick={() => setShowAllPreviousSessions(false)}
                            className="w-1/3 sticky bottom-5 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white text-base cursor-pointer"
                          >
                            Show Less
                          </motion.button>
                        )}
                    </motion.div>
    
                    {/* Right Section: Quick Actions */}
                    <motion.div
                    className="bg-gray-800 p-6 rounded shadow-md flex flex-col items-center text-center flex-[1]"
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5 }}
                    >
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
    
                    <div className="w-full mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-center">My Workouts</h3>
                        {workouts.length === 0 ? (
                        <p className="text-sm text-gray-400">No workouts found.</p>
                        ) : (
                        <div className="space-y-4">
                            {workouts.map((workout) => (
                            <div key={workout.id}>
                                <div className="p-3 bg-gray-700 rounded hover:bg-gray-600 flex justify-between items-center">
                                <p className="font-semibold mb-0">{workout.name}</p>
                                <div className="flex space-x-2 mt-2">
                                    <motion.button
                                    onClick={() => navigate(`/workouts/update/${workout.id}`)}
                                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded cursor-pointer"
                                    name="viewWorkoutButton"
                                    whileHover={{ scale: 1.05 }}
                                    >
                                    Edit
                                    </motion.button>
                                    <motion.button
                                    onClick={() => handleDeleteWorkout(workout.id)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                    >
                                    Delete
                                    </motion.button>
                                    <motion.button
                                    onClick={() => navigate(`/${workout.id}/workout/session/create`)}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer"
                                    name="startWorkoutButton"
                                    whileHover={{ scale: 1.05 }}
                                    >
                                    Start
                                    </motion.button>
                                </div>
                                </div>
                            </div>
                            ))}
                        </div>
                        )}
                    </div>
    
                    <motion.button
                        onClick={() => navigate("/workouts/create")}
                        className="w-3/4 mb-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded cursor-pointer"
                        name="createWorkoutButton"
                        whileHover={{ scale: 1.05 }}
                    >
                        Create New Workout
                    </motion.button>
                    <motion.button
                        onClick={() => navigate("/exercises")}
                        className="w-3/4 mb-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                    >
                        Exercise List
                    </motion.button>
                    <motion.button
                        onClick={() => navigate("/calendar")}
                        className="w-3/4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                    >
                        Calendar
                    </motion.button>
                    </motion.div>
                </motion.div>
                )}
            </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}