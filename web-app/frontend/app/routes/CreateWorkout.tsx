import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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

const NewWorkout: React.FC = () => {
    const [newWorkoutName, setNewWorkoutName] = useState<string>(""); 
    const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken"); // Retrieve JWT token
        if (!token) { // Redirect to login if token is missing
        navigate("/login");
        return;
    };

    }, [navigate]);

  //Function to handle adding a new workout
  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the form from reloading the page

    const token = localStorage.getItem("accessToken"); 
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/workouts/create/", { // Send a POST request to the backend to create a new workout
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newWorkoutName,
          exercises: selectedExercises,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to add workout:", errorData);
        alert(`Failed to add workout: ${errorData.detail || JSON.stringify(errorData)}`);
        return;
      }

      const newWorkout = await response.json(); 
      setNewWorkoutName("");
      setSelectedExercises([]); // Clear the form fields
    } catch (error) {
      console.error("Error adding workout:", error);
      alert("An unexpected error occurred.");
    }
  };

  const handleAddExercise = () => {
    console.log("Adding exercise to the workout");
  };

  return (
    
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
        <h2 className="text-xl font-bold mb-2">Create New Workout</h2>
        <form onSubmit={handleAddWorkout}></form>
        <input
        type="text"
        value={newWorkoutName}
        onChange={(e) => setNewWorkoutName(e.target.value)}
        placeholder="Workout name"
        className="w-full p-2 rounded bg-gray-700 text-white mb-4"
        required
        />

      {/* Add Exercise to the Workout */}
      <motion.button
        onClick={() => navigate("/exercises")}
        className="absolute top-4 right-4 bg-blue-700 hover:bg-red-700 px-4 py-2 rounded"
        whileHover={{ scale: 1.05 }}
      >
        Add Exercise
      </motion.button>
    </motion.div>
  );
};

export default NewWorkout;

