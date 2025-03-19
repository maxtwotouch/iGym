import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import 'bootstrap/dist/css/bootstrap.css';
import NavBar from "~/components/NavBar";
import Footer from "~/components/Footer";
import 'tailwindcss/tailwind.css';
import 'bootstrap/dist/css/bootstrap.css';
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'; // Vite environment variable for testing or default localhost URL


// Interface to define the structure of a workout object
interface Workout {
  id: number;
  name: string;
  date_created: string;
  exercises: number[];
}

// Interface to define the structure of an exercise object
interface Exercise {
  name: string;
  id: number;
}

const CustomerDashboard: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]); 
  const [username, setUsername] = useState<string>(""); 
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken"); // Retrieve JWT token
    if (!token) {
      navigate("/login"); 
      return;
    }
    const name = localStorage.getItem("username");
    setUsername(name || "user"); 

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

        {/* Display user's name */}
        <motion.h1
          className="text-4xl font-bold mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Hello, {username}
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
                    name="startWorkoutButton"
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
      <Footer/>
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