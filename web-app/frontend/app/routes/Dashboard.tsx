import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";
import Footer from "~/components/Footer";
import ChatRoom from "~/components/ChatRoom";

import 'tailwindcss/tailwind.css';
import 'bootstrap/dist/css/bootstrap.css';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'; // Vite environment variable for testing or default localhost URL


// Interface to define the structure of a workout object
type Workout = {
  id: number;
  name: string;
  date_created: string;
  exercises: number[];
}

// Interface to define the structure of an exercise object
type Exercise = {
  name: string;
  id: number;
}

interface WorkoutSession {
  id: number;
  start_time: string;
  workout: number;
  calories_burned: number;
  exercise_sessions: ExerciseSession[];
}

interface ExerciseSession {
  id: number;
  exercise: number;
  sets: Set[];
}

interface Set {
  id: number;
  repetitions: number;
  weight: number;
}

type User = {
  id: number;
  username: string;
};

type Notification = {
  id: number;
  sender: string;
  chat_room_id: number;
  chat_room_name: string;
  date_sent: Date;
  message: string | null;
  workout_message: string | null; // Name of the workout
};

type chatRoom = {
  id: number;
}



const CustomerDashboard: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [username, setUsername] = useState<string>("User"); 
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<User | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [uniqueNotifications, setUniqueNotifications] = useState<Notification[]>([]);
  const [chatRooms, setChatRooms] = useState<chatRoom[]>([]);
  const socketsRef = useRef<Map<number, WebSocket>>(new Map());

  // Function to delete a workout
  const deleteWorkout = async (workoutId: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
  
    try {
      const response = await fetch(`${backendUrl}/workouts/delete/${workoutId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!response.ok) {
        console.error("Failed to delete workout");
        return;
      }
  
      // Update the workouts state to remove the deleted workout
      setWorkouts(workouts.filter((workout) => workout.id !== workoutId));
    } catch (error) {
      console.error("Error deleting workout:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken"); // Retrieve JWT token
    if (!token) {
      navigate("/login"); 
      return;
    }

    const name = localStorage.getItem("username");
    setUsername(name || "User"); 
    
    // Fetch workout sessions from the backend
    const fetchWorkoutSessions = async () => {
      try {
        const response = await fetch(`${backendUrl}/workouts_sessions/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          console.error("Failed to fetch workout sessions");
          return;
        }
        const data = await response.json();
        console.log("Fetched workout sessions:", data);
        setWorkoutSessions(data);
      } catch (error) {
        console.error("Error fetching workout sessions:", error);
      }
    };

    // Fetch exercises from the backend
    const fetchExercises = async () => {
      try {
        const response = await fetch(`${backendUrl}/exercises/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          console.error("Failed to fetch exercises");
          return;
        }
        const data = await response.json();
        setExercises(data);
      }
      catch (error) {
        console.error("Error fetching exercises:", error);
      }
    };

    // Fetch workouts from the backend
    const fetchWorkouts = async () => {
    try {
      const response = await fetch(`${backendUrl}/workouts/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error("Failed to fetch workouts");
        return;
      }
      const data = await response.json(); 
      console.log("Fetched workouts:", data);
      setWorkouts(data); 
    } catch (error) {
      console.error("Error fetching workouts:", error);
    }
  };

  const fetchUserChatRooms = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Access token not found in localStorage");
      navigate("/login");
    }

    try {
      const chatRoomsResponse = await fetch(`${backendUrl}/chat_rooms/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chatRoomsData = await chatRoomsResponse.json();
      setChatRooms(chatRoomsData);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    }
  }

  const fetchTrainer = async () => {
    try {
      const userResponse = await fetch(`${backendUrl}/user/${localStorage.getItem("user_id")}/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userResponse.json();

      console.log("user data:", userData);

      // Translate from profile id to user id
      const trainersResponse = await fetch(`${backendUrl}/personal_trainers/`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
      });
      const trainerData = await trainersResponse.json();

      trainerData.find((trainer: any) => { 
          if (trainer.trainer_profile.id === userData.profile.personal_trainer) {
              setTrainer({ id: trainer.id, username: trainer.username });
          }
      });
    } catch (error) {
      console.error("Error fetching trainer data:", error);
    }
  };


  const fetchChatRoomPt = async () => {
    try {
      const userResponse = await fetch(`${backendUrl}/user/${localStorage.getItem("user_id")}/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userResponse.json();
      const roomId = userData.profile.pt_chatroom;
      setRoomId(roomId);
    } catch (error) {
      console.error("Error fetching chat room data:", error);
    }
  };

  const notificationsList = async () => {
    try {
      const notificationsUserResponse = await fetch(`${backendUrl}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const notificationsUserData = await notificationsUserResponse.json();
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

    fetchWorkoutSessions();
    fetchWorkouts();
    fetchExercises();
    fetchTrainer();
    fetchChatRoomPt();
    notificationsList();
    fetchUserChatRooms();

  }, [navigate]);

  // Connect to WebSocket, listen for notifications from chat rooms
  useEffect(() => {
    if (chatRooms.length === 0) return; 

        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("Access token not found in localStorage");
            navigate("/login");
        }

    const roomIds = chatRooms.map((room) => room.id); // Room IDs which User is participant of

    roomIds.forEach((idRoom) => {
      const existingSocket = socketsRef.current.get(idRoom);
      if (existingSocket) { // Close existing WebSocket connection, for the same chat room
        existingSocket.close();
      }

      if (!idRoom || typeof idRoom !== "number") {
        console.warn("Invalid room id:", idRoom);
        return;
      }

      const socket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${idRoom}/?token=${token}`); 
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

          if (notification.sender == localStorage.getItem("username")) {
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
					await fetch(`${backendUrl}/notification/delete/${notification.id}/`, {
						method: "DELETE",
						headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
					});
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


  return (
    <motion.div className="d-flex flex-column min-vh-100">
      <NavBar />

      {/* Main content */}
      <motion.div
        className="d-flex flex-row flex-grow-1 bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4"        
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >

				{/* Left section: Personal Trainer */}
				<motion.div
				className="bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center text-center w-full md:w-1/4"
				initial={{ y: 20 }}
				animate={{ y: 0 }}
				transition={{ duration: 0.5 }}
				>

					{/* Notification Section (Chat Room) */}
					<motion.div>
						<motion.h3
							className="text-3xl font-bold mb-6"
							initial={{ y: -20 }}
							animate={{ y: 0 }}
							transition={{ duration: 0.5 }}
						>
							Notifications
						</motion.h3>

						<motion.ul
							className="bg-gray-800 p-2 rounded-lg shadow-md w-full max-w-md space-y-1"
							initial={{ scale: 0.95 }}
							animate={{ scale: 1 }}
							transition={{ duration: 0.3 }}
						>
							{uniqueNotifications.map((notif) => (
								<motion.li
									key={notif.id}
									onClick={() => handleNotificationClick(notif.chat_room_id)}
									className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
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
										<div className="text-xs text-gray-400 whitespace-nowrap ml-1 flex-shrink-0">
											<span className="mr-1">⏱️</span>
											{formatTimeAgo(notif.date_sent)}
										</div>
									</div>
									<div className="text-sm text-gray-300 truncate">
										{notif.message || (notif.workout_message && `🏋️‍♂️ ${notif.workout_message}`)}
									</div>
								</motion.li>
							))}
						</motion.ul>

					</motion.div>
					{/* Chat Room with PT */}
					{trainer && roomId &&(
						<motion.div>
							<ChatRoom chatRoomId={roomId ?? -1} onLeave={() => setRoomId(null)} />
						</motion.div> 
					)}
					{/* Get a PT section */}
					{!trainer && (
						<motion.div>
							<h2 className="text-xl font-bold mb-4">My Personal Trainer</h2>
							<p className="text-gray-400">You do not have a personal trainer yet.</p>
							<motion.button
								onClick={() => navigate("/personalTrainers")}
								className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
								whileHover={{ scale: 1.05 }}
							>
								Find a personal trainer
							</motion.button>
						</motion.div>
					)}
				</motion.div>

      {/* Middle Section: Feed */}
      <motion.div className="w-100 mb-3">
        <div className="w-100 mb-3">
          <h3 className="text-lg font-semibold mb-2 text-center">Sessions Performed</h3>
          {workoutSessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center">No History</p>
          ) : (
            <ul className="space-y-2 w-100">
              {workoutSessions.slice().reverse().map((session) => {
                const workout = workouts.find((workout) => workout.id === session.workout);
                const workoutName = workout ? workout.name : "Unknown Workout";

                return (
                  <li
                    key={session.id}
                    className="p-2 bg-gray-700 rounded hover:bg-gray-600 d-flex flex-column"
                  >
                    {/* Display info about the session */}
                    <p className="font-semibold mb-0">💪 {workoutName}</p>
                    <div className="d-flex flex-column">
                      <p className="text-sm text-gray-400 mt-1">
                        🔥 Calories Burned: <span className="font-semibold text-white">{session.calories_burned}</span>
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
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

              {/* Exercise Sessions */}
              <div className="mt-3">
                <ul className="mt-2">
                  {session.exercise_sessions.map((exerciseSession) => {
                    const exercise = exercises.find((ex) => ex.id === exerciseSession.exercise);
                    const exerciseName = exercise ? exercise.name : "Unknown Exercise";

                    return (
                      <li key={exerciseSession.id} className="mb-2">
                        <p className="text-white font-semibold">{exerciseName}</p>
                        <ul className="ml-4 text-sm text-gray-400">
                          {exerciseSession.sets.map((set, index) => (
                            <li key={set.id} className="flex justify-between">
                              <span>Set {index + 1}: </span>
                              <span className="font-semibold text-white">{set.repetitions} reps</span>
                              <span className="font-semibold text-white">{set.weight} kg</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </div>
</motion.div>

        
				{/* Right Section: Quick Actions */}
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center text-center w-full md:w-1/4"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
					<h2 className="text-xl font-bold mb-4">Quick Actions</h2>

					{/* My Workouts list */}
					<div className="w-full mb-6">
						<h3 className="text-lg font-semibold mb-4 text-center">My Workouts</h3>
            {workouts.length === 0 ? (
              <p className="text-sm text-gray-400">No workouts found.</p>
						) : (
							<ul className="space-y-4">
								{workouts.map((workout) => (
									<li
										key={workout.id}
										className="p-2 bg-gray-700 rounded hover:bg-gray-600"
									>
										{/* Display workout name and buttons */}
										<div className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 flex justify-between items-center">
											<p className="font-semibold mb-0">{workout.name}</p>
											<div className="flex justify-between mt-2">
												{/* Edit Workout Button */}
												<motion.button
													onClick={() => navigate(`/workouts/update/${workout.id}`)}
													className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
													whileHover={{ scale: 1.05 }}
												>
													Edit
												</motion.button>
											
												{/* Delete Workout Button */}
												<motion.button
													onClick={() => deleteWorkout(workout.id)}
													className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
													whileHover={{ scale: 1.05 }}
												>
													Delete
												</motion.button>

												{/* Start workout session of specific workout (logging) */}
												<motion.button
													onClick={() => navigate(`/${workout.id}/workout/session/create`)}
													className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
													whileHover={{ scale: 1.05 }}
												>
													Start
												</motion.button>
											</div>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
										
					{/* Create workout button */}
					<motion.button
						onClick={() => navigate("/workouts/create")}
            name="createWorkoutButton"
						className="w-3/4 mb-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
						whileHover={{ scale: 1.05 }}
					>
						Create New Workout
					</motion.button>

					{/* Exercise List button */}
          <motion.button
            onClick={() => navigate("/exercises")}
            className="w-3/4 mb-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            whileHover={{ scale: 1.05 }}
          >
            Exercise List
          </motion.button>

					{/* Calendar button */}
          <motion.button
            onClick={() => navigate("/calendar")}
            className="w-3/4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            whileHover={{ scale: 1.05 }}
          >
            Calendar
          </motion.button>
				</motion.div>
			</motion.div>
			<Footer />
		</motion.div>
	);
};



const TrainerDashboard: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    
    const name = localStorage.getItem("username");
    setUsername(name || "trainer");

    const fetchWorkouts = async () => {
      try {
        const response = await fetch(`${backendUrl}/workouts/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          console.error("Failed to fetch workouts");
          return;
        }
        const data = await response.json(); 
        console.log("Fetched workouts:", data);
        setWorkouts(data); 
      } catch (error) {
        console.error("Error fetching workouts:", error);
      }
    };

    const fetchExercises = async () => {
      try {
        const response = await fetch(`${backendUrl}/exercises/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          console.error("Failed to fetch exercises");
          return;
        }
        const data = await response.json();
        setExercises(data);
      } catch (error) {
        console.error("Error fetching exercises:", error);
      }
    };

    fetchExercises();
    fetchWorkouts();

  }, [navigate]);

  const deleteWorkout = (workout: Workout) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    fetch(`${backendUrl}/workouts/delete/${workout.id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      setWorkouts(workouts.filter((w) => w.id !== workout.id));
    });
  }

  return (
    <motion.div className="d-flex flex-column min-vh-100">
      <NavBar />
      <motion.div
        className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Display trainer's name */}
        <motion.h1
          className="text-4xl font-bold mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Hello, Trainer {username}
        </motion.h1>

        <motion.button
            name="createWorkoutButton"
            onClick={() => navigate("/workouts/create")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            whileHover={{ scale: 1.05 }}
          >
            Create New Workout
          </motion.button>

        {/* Workout List */}
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-md w-96"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-4">My Workouts</h2>

          {workouts.length === 0 ? (
            <p className="text-sm text-gray-400">No workouts found.</p>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <motion.div
                  id="workoutElement"
                  key={workout.id}
                  className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 cursor-pointer position-relative"
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Delete workouts from Workout List */}
                  <motion.button
                    onClick={() => deleteWorkout(workout)}
                    className="btn btn-danger position-absolute top-0 end-0 m-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    ✕
                  </motion.button>
                
                  {/* Display workout name */}
                  <p className="font-semibold">{workout.name}</p>
                  <p className="text-sm text-gray-400">
                    Created: {new Date(workout.date_created).toLocaleString()}
                  </p>

                  {/* Display exercises in the workout */}
                  <p className="mt-2">Exercises:</p>
                  <ul className="list-disc list-inside">
                  {workout.exercises.map((exerciseId) => {
                      const exercise = exercises.find((ex) => ex.id === exerciseId);
                      return (
                        <li key={exerciseId} className="text-sm">
                        {exercise ? exercise.name : "Unknown Exercise"}
                        </li>
                      );
                    })}
                  </ul>

                  {/* View Workout Button */}
                  <motion.button
                    name="viewWorkoutButton"
                    onClick={() => navigate(`/workouts/update/${workout.id}`)}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                    whileHover={{ scale: 1.05 }}
                  >
                    View Workout
                  </motion.button>

                  {/* Start workout session (logging) */}
                  <motion.button
                    onClick={() => navigate(`/${workout.id}/workout/session/create`)}
                    className="mt-2 w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                    whileHover={{ scale: 1.05 }}
                  >
                    Start Workout
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
      <Footer />
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    setUserType(localStorage.getItem("userType"));
  }, [navigate]);

  if (!userType) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      {userType === "user" ? <CustomerDashboard /> : <TrainerDashboard />}
    </div>
  );
};

export default Dashboard;