import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLoaderData } from "react-router";
import { motion, number } from "framer-motion";
import { AnimatePresence } from "framer-motion";

import apiClient from "~/utils/api/apiClient";
import ChatRoom from "../Chat/ChatRoom";

import { deleteWorkout } from "~/utils/api/workouts";
import { fetchExercises } from "~/utils/api/exercises";
import defaultProfilePicture from "~/assets/defaultProfilePicture.jpg";



import type { Workout, Exercise, chatRoom, Notification, User } from "~/types";
import { useAuth } from "~/context/AuthContext"; 

export const TrainerDashboard: React.FC = () => {
    const loaderData = useLoaderData<{
        workouts: Workout[];
        exercises: Exercise[];
        userType: string;
    }>();

    const [workouts, setWorkouts] = useState<Workout[]>(loaderData.workouts || []);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [uniqueNotifications, setUniqueNotifications] = useState<Notification[]>([]);
    const [chatRooms, setChatRooms] = useState<chatRoom[]>([]);
    const [clients, setClients] = useState<User[]>([]);
    const [selectedChatRoomId, setSelectedChatRoomId] = useState<number | null>(null);
    const [chatRoomVisible, setChatRoomVisible] = useState(false);
    const [ptScheduledWorkouts, setPtScheduledWorkouts] = useState<any[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [workoutIdToDelete, setWorkoutIdToDelete] = useState<number | null>(null); 
    const socketsRef = useRef<Map<number, WebSocket>>(new Map());
    const navigate = useNavigate();
    const { user } = useAuth(); // Get user info from AuthContext

    useEffect(() => {

        // Fetch the notifications for the current user
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

          // Fetch the chat room data for the current user
          const fetchUserChatRooms = async () => {        
            try {
              const chatRoomsResponse = await apiClient.get("/chat/");
              const chatRoomsData = chatRoomsResponse.data;
              setChatRooms(chatRoomsData);
            } catch (error) {
              console.error("Error fetching chat rooms:", error);
            }
          }
          
          // Fetch all the clients and client data for the current personal trainer
          const fetchClients = async () => {
            try {
              const clientsResponse = await apiClient.get("/trainer/clients/");
              const clientsData = clientsResponse.data;
              const clients: User[] = clientsData.map((client: any) => ({
                id: client.id,
                username: client.username,
                first_name: client.first_name,
                last_name: client.last_name,
                profile: {
                  id: client.profile.id,
                  height: client.profile.height,
                  weight: client.profile.weight,
                  pt_chatroom: client.profile.pt_chatroom,
                  profile_picture: client.profile.profile_picture,
                }
              }));
              setClients(clients);

            } catch (error) {
              console.error("Error fetching clients:", error);
            }
          }
        
          notificationsList();
          fetchUserChatRooms();
          fetchClients();
    }, [navigate]);

    // Fetch the scheduled workouts for the current personal trainer
    const fetchPtScheduledWorkouts = async () => {
        try {
          const [scheduledRes, clientsRes] = await Promise.all([
            apiClient.get("/schedule/pt_workout/"),
            apiClient.get("trainer/clients/"),
          ]);
      
          const scheduledData = await scheduledRes.data;
          const clientsData: User[] = await clientsRes.data;

          const allExercises = fetchExercises();
          console.log("All Exercises:", allExercises);
      
          const withUser = scheduledData.map((item: any) => {
            const client = clientsData.find(c => c.id === item.client);
            return {
              ...item,
              client_username: client?.username || "Client",
              client_first_name: client?.first_name || "First Name",
              client_last_name: client?.last_name || "Last Name",
              exercises: allExercises || [],
            };
          });
      
          console.log("Processed Scheduled Workouts:", withUser);

          setPtScheduledWorkouts(withUser);
        } catch (error) {
          console.error("Error fetching scheduled workouts or clients:", error);
        }
      };

      useEffect(() => {
        fetchPtScheduledWorkouts();
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


 	useEffect(() => {
    // Sort notifications by date sent, only show the most recent from each chat room
    const sortedNotifications = [...notifications].sort(
      (a, b) => b.date_sent.getTime() - a.date_sent.getTime()
    );

    // Filter out duplicate notifications (notifications from the same chat room, only show the most recent one)
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

    // Delete all notifications from the chat room and navigate to the chat room on click
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
    
    // Format the time difference between the current date and the notification date
    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        date = new Date(date);
        const diff = (now.getTime() - date.getTime()) / 1000; // Difference in seconds, getTime defaults to milliseconds

        if (diff < 60) return `${Math.floor(diff)}s ago`; // Less than a minute
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; // Less than an hour
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; // Less than a day
        if (diff > 86400) return `${Math.floor(diff / 86400)}d ago`; // Days ago
    };

    // Handle deletion of workout
    const handleDeleteWorkout = async (workoutId: number) => {
      try {
        await deleteWorkout(workoutId); 
        setWorkouts(prevWorkouts => prevWorkouts.filter(w => w.id !== workoutId));
      } catch (error) {
        console.error("Failed to delete workout from dashboard:", error);
        alert("Could not delete the workout. Please try again.");
      }
      setWorkoutIdToDelete(null); 
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
        
        {/* Left section: notifications and client list*/}
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

            {/* Notification list */}
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
                  {/* Notification content: Sender, chat room, time ago */}
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


          {/* Client list */}
          <motion.div className="w-full mt-4">
            <h2 className="text-xl font-bold mb-4">My Clients</h2>

            {clients.length === 0 ? (
              <p className="text-gray-400">No clients found.</p>
            ) : (
              <ul className="space-y-2">
                {clients.map((client) => (
                  <li
                    key={client.id}
                    className="flex items-center justify-between p-2"
                  >
                    {/* Profile Picture */}
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-600">
                        <img
                          src={client.profile?.profile_picture || defaultProfilePicture}
                          alt={`${client.first_name}'s profile`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Client name + Username */}
                      <div className="flex flex-col text-left">
                        <h3 className="text-lg font-semibold truncate w-50">
                          {client.first_name} {client.last_name}
                        </h3>
                        <p className="text-lg text-gray-400 truncate w-50">{client.username}</p>
                      </div>
                    </div>

                    {/* Chat Button */}
                    <motion.button
                      // Toggle chat room visibility
                      onClick={() => {
                        const selectedChatRoomId = client.profile?.pt_chatroom; // Get the chat room ID from the client's profile
                        if (selectedChatRoomId) {
                          setSelectedChatRoomId(selectedChatRoomId);            // Save the selected chat room ID to open the right chat room
                          setChatRoomVisible(!chatRoomVisible)};                // Toggle the chat room 
                        }
                      }
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
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
        
        {/* Middle and right section: Chat Room or Dashboard Content */}
        <AnimatePresence mode="wait">
          {/* If chat room is visible, show the chat room component */}
          {chatRoomVisible ? (
            <motion.div
              key="chatRoom"
              className="flex flex-col text-center w-full flex-[3]"
              initial={{ opacity: 0, scale: 0.9, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div>
                {/* Close chat room button */}
                <motion.button
                  onClick={() => setChatRoomVisible(false)}
                  className="text-white text-2xl rounded-full cursor-pointer absolute right-10"
                  aria-label="Close Chat Room"
                  whileHover={{ scale: 1.1 }}
                >
                  ✕
                </motion.button>
              </div>
              {/* Chat Room component */}
              <ChatRoom chatRoomId={selectedChatRoomId ?? -1} onLeave={() => {
                setSelectedChatRoomId(null);  // Reset selected chat room ID
                setChatRoomVisible(false);    // Hide chat room
              }} 
                />
            </motion.div>
          
          ) : (
            // If chat room is not visible, show the dashboard content
            <motion.div
              key="dashboardContent"
              className="flex flex-row gap-x-6 flex-[3]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
            
              {/* Middle Section: Upcomming sessions */}
              <motion.div className="p-6 rounded flex flex-col items-center flex-[2] w-full">
                <h3 className="text-xl font-bold mb-4 text-center">Upcoming Sessions</h3>
                
                {ptScheduledWorkouts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center">No upcoming sessions</p>
                ) : (
                  
                  // List of upcoming sessions
                  <ul className="space-y-4 w-full">
                  {ptScheduledWorkouts
                    .filter((w) => new Date(w.scheduled_date) > new Date())
                    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                    .slice(0, showAll ? undefined : 5)
                    .map((w, i) => (

                    // Diplay client name and scheduled date
                    <li key={i} className="p-4 bg-gray-800 rounded text-white w-full">
                      <div className="mb-2 flex flex-row items-center justify-between">
                        <span className="block text-lg font-semibold">👤 Client: {w.client_first_name} {w.client_last_name} </span>
                        <span className="text-sm text-gray-300">📅 {new Date(w.scheduled_date).toLocaleString("en-GB")}</span>
                      </div>
                      
                      {/* Display workout template name and exercises */}
                      <span className="block text-md font-medium">🏋️ Workout: {w.workout_title} </span>
                      {/* <ul className="mt-2 px-2 text-sm">
                        {w.exercises.map((ex: Exercise, idx: number) => (
                          <li className="py-1" key={idx}> 
                          <span className="font-semibold">Exercise {idx + 1}: </span>{ex.name}
                          </li>
                        ))}
                      </ul> */}
                    </li>
                    ))}
                  </ul>
                )}

                {/* Show more button, if number of sessions exceed 5*/}
                {ptScheduledWorkouts.length > 5 && !showAll && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    name="showMoreButton"
                    onClick={() => setShowAll((prev) => !prev)}
                    className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white text-base cursor-pointer"
                  >
                    {"Show More"}
                  </motion.button>
                )}

                {/* Show less button (sticky bottom) */}
                {showAll && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setShowAll(false)}
                    className="w-1/3 sticky bottom-5 mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white text-base cursor-pointer"
                  >
                    {"Show Less"} 
                  </motion.button>
                )}
              </motion.div>

              {/* Right Section: Quick Actions */}
              <motion.div
                className="bg-gray-800 p-6 rounded shadow-md flex flex-col items-center text-center w-full md:w-1/3"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>

                {/* Workout list */}
                <div className="w-full mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-center">My Workouts</h3>
                  {workouts.length === 0 ? (
                    <p className="text-sm text-gray-400">No workouts found.</p>
                  ) : (
                  <div className="space-y-4">
                    {workouts.map((workout) => (
                      <div key={workout.id}>

                        {/* Workout name */}
                        <div className="p-3 bg-gray-700 rounded flex justify-between items-center">
                          <p className="font-semibold mb-0 truncate">{workout.name}</p>
                          <div className="flex space-x-2 mt-2">
                            {/* Edit workout button */}
                            <motion.button
                              onClick={() => navigate(`/workouts/update/${workout.id}`)}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded cursor-pointer"
                              name="viewWorkoutButton"
                              whileHover={{ scale: 1.05 }}
                              >
                              Edit
                            </motion.button>
                            
                            {/* Delete workout button */}
                            <motion.button
                              onClick={() => setWorkoutIdToDelete(workout.id)} 
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                              whileHover={{ scale: 1.05 }}
                              >
                              Delete
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
                
                {/* Create new workout button */}
                <motion.button
                  onClick={() => navigate("/workouts/create")}
                  className="w-3/4 mb-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded cursor-pointer"
                  name="createWorkoutButton"
                  whileHover={{ scale: 1.05 }}
                >
                  Create New Workout
                </motion.button>
                
                {/* Navigate to exercise list */}
                <motion.button
                  onClick={() => navigate("/exercises")}
                  className="w-3/4 mb-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                >
                  Exercise List
                </motion.button>

                {/* Navigate to calendar */}
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

      {/* Delete Workout Confirmation Modal */}
      {workoutIdToDelete !== null && ( 
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96 space-y-4">
            <h3 className="text-xl font-semibold text-center">Are you sure you want to delete the workout from your workout list?</h3>
            <p className="text-sm text-gray-400 text-center">This action cannot be undone.</p>
            <div className="space-x-4 flex items-center justify-center">
              <motion.button
                onClick={() => setWorkoutIdToDelete(null)}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-500 text-white cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={() => {
                  if (workoutIdToDelete !== null) {
                      handleDeleteWorkout(workoutIdToDelete);
                  }
                }} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                Delete
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
    ); 
};