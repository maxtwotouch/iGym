import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import 'bootstrap/dist/css/bootstrap.css';
import NavBar from "~/components/NavBar";
import 'bootstrap/dist/css/bootstrap.css'


// Interface to define the structure of a workout object
interface Workout {
  id: number;
  name: string;
  date_created: string;
  exercises: number[];
}

// Interface to define the structure of an exercise object
interface Exercise {
  id: number;
  name: string;
}

const CustomerDashboard: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]); // Store user's workouts
  const [newWorkoutName, setNewWorkoutName] = useState<string>(""); 
  const [username, setUsername] = useState<string>("");
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]); // Store available exercises
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken"); // Retrieve JWT token
    if (!token) { // Redirect to login if token is missing
      navigate("/login");
      return;
    }

    const name = localStorage.getItem("username"); 
    setUsername(name || "User"); // Set username to display

    // Fetch workouts from the backend
    const fetchWorkouts = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/workouts/", {
          headers: { Authorization: `Bearer ${token}` }, // Include JWT token for authentication so the backend can verify the user's identity
        });
        if (!response.ok) {
          console.error("Failed to fetch workouts");
          return;
        }
        const data = await response.json();
        setWorkouts(data); // Store the fetched workouts in the state
      } catch (error) {
        console.error("Error fetching workouts:", error);
      }
    };

    // Fetch available exercises from the backend
    const fetchExercises = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/exercises/", {
          headers: { Authorization: `Bearer ${token}` }, // Include JWT token for authentication so the backend can verify the user's identity
        });
        if (!response.ok) {
          console.error("Failed to fetch exercises");
          return;
        }
        const data = await response.json();
        setAvailableExercises(data); // Store the fetched exercises in the state
      } catch (error) {
        console.error("Error fetching exercises:", error);
      }
    };

    fetchWorkouts();
    //fetchExercises();
  }, [navigate]); // Call the effect whenever the user navigates to a new page

  const handleLogout = () => { 
    localStorage.removeItem("accessToken"); 
    navigate("/login");
  };  


  // const handleExerciseSelection = (exerciseId: number) => {
  //   setSelectedExercises((prev) => // Toggle the selected exercise
  //     prev.includes(exerciseId) // Check if the exercise is already selected
  //       ? prev.filter((id) => id !== exerciseId) // Remove the exercise if it is already selected
  //       : [...prev, exerciseId] // Add the exercise if it is not already selected
  //   );
  // };

  // Function to get the names of the exercises based on their IDs
  const getExerciseNames = (exerciseIds: number[]) => {
    return exerciseIds
    .map((id) => availableExercises.find((ex) => ex.id === id)?.name)
    .filter(Boolean); // Remove any undefined values
  };

  // Function to handle adding a new workout
  // const handleAddWorkout = async (e: React.FormEvent) => {
  //   e.preventDefault(); // Stop the form from reloading the page

  //   const token = localStorage.getItem("accessToken"); 
  //   if (!token) {
  //     navigate("/login");
  //     return;
  //   }

  //   try {
  //     const response = await fetch("http://127.0.0.1:8000/workouts/", { // Send a POST request to the backend to create a new workout
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         name: newWorkoutName,
  //         exercises: selectedExercises,
  //       }),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       console.error("Failed to add workout:", errorData);
  //       alert(`Failed to add workout: ${errorData.detail || JSON.stringify(errorData)}`);
  //       return;
  //     }

  //     const newWorkout = await response.json(); 
  //     setWorkouts((prevWorkouts) => [...prevWorkouts, newWorkout]); // Add the new workout to the list of workouts
  //     setNewWorkoutName("");
  //     setSelectedExercises([]); // Clear the form fields
  //   } catch (error) {
  //     console.error("Error adding workout:", error);
  //     alert("An unexpected error occurred.");
  //   }
  // };

  return (

    <motion.div className="d-flex flex-column min-vh-100">
      <NavBar/>
      
      <motion.div
        className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
      {/* Title */}
      <motion.h1
        className="text-4xl font-bold mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        Hello, {username}
      </motion.h1>

      {/* Logout Button */}
      <motion.button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        whileHover={{ scale: 1.05 }}
      >
        Logout
      </motion.button>

      {/* Create New Workout Button */}
      <motion.button
      onClick={() => navigate("/create")}
      className="absolute top-[300px] right-[1870px] bg-blue-700 hover:bg-red-700 px-4 py-2 rounded"
      whileHover={{ scale: 1.05 }}

      >
        Create New Workout
      </motion.button>

      {/* Display Workouts */}
      <motion.div
        className="bg-gray-800 p-4 rounded-lg shadow-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold">My Workouts</h2>
        {workouts.length === 0 ? (
          <p className="mt-2">No workouts found.</p>
        ) : (
          workouts.map((workout) => (
            <div
              key={workout.id}
              className="mt-4 border-b border-gray-700 pb-4"
            >
              <p className="font-semibold">{workout.name}</p>
              <p className="text-sm text-gray-400">
                Created: {new Date(workout.date_created).toLocaleString()}
              </p>
              <ul className="text-gray-300 mt-2">
                {getExerciseNames(workout.exercises).map((exerciseName, index) => (
                  <li key={index}>• {exerciseName}</li>
                ))}
              </ul>
              <button
                onClick={() => navigate(`/workouts/${workout.id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 mt-2 rounded"
              >
                Go to Workout
              </button>
            </div>
          ))
        )}
        </motion.div>
      </motion.div>
      <Footer/>
    </motion.div>
  );
};

const TrainerDashboard: React.FC = () => (
  <div className="p-8">
    <h1 className="text-4xl font-bold mb-4">Personal Trainer Dashboard</h1>x
    <p className="text-lg">
      Welcome! Manage your client appointments, track progress, and update your
      training packages.
    </p>
  </div>
);

const Dashboard: React.FC = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    console.log("Retrieved token:", token);
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setUserType("user");
    } catch (error) {
      navigate("/login");
    }
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