import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

// Interface to define the structure of a workout object
interface Workout {
  id: number;
  name: string;
  date_created: string;
  author: string;
  exercises: number[];
}

// Interface to define the structure of an exercise object
interface Exercise {
  id: number;
  name: string;
  description: string;
  muscle_group: string;
}

const WorkoutDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Extract the ID from the URL
  const [workout, setWorkout] = useState<Workout | null>(null); 
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
  const [workoutName, setWorkoutName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      // Retrieve the access token from local storage
      const token = localStorage.getItem("accessToken");
      if (!token) {
        // Redirect to login page if no token is found
        navigate("/login");
        return;
      }

      try {
        // Fetch workout details from the API
        const response = await fetch(`http://127.0.0.1:8000/workouts/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          console.error("Failed to fetch workout details");
          return;
        }

        // Convert response to JSON and update state
        const data = await response.json();
        setWorkout(data); 
        setWorkoutName(data.name);
        setSelectedExercises(data.exercises);
      } catch (error) {
        console.error("Error fetching workout details:", error);
      }
    };

    const fetchExercises = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }   

        try {
            const response = await fetch(`http://127.0.0.1:8000/exercises/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
        
            if (!response.ok) {
                console.error("Failed to fetch exercises");
                return;
            }

            const data = await response.json();
            setAvailableExercises(data);
        } catch (error) {
            console.error("Error fetching exercises:", error);
        }
    };
            
    fetchWorkoutDetails();
    fetchExercises();
  }, [id, navigate]); // Run effect when ID or navigation changes

    const getExerciseObjects = () => {
      return selectedExercises.map((id) => availableExercises.find((exercise) => exercise.id === id)).filter(Boolean) as Exercise[];
    };

    const handleSaveWorkout = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
        navigate("/login");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/workouts/${id}/`, {
            method: "PUT",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
            name: workoutName,
            exercises: selectedExercises,
            }),
        });

        if (!response.ok) {
            console.error("Failed to save workout");
            return;
        }

        alert("Workout saved successfully!");
        } catch (error) {
            console.error("Error saving workout:", error);
        }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <button
        onClick={() => navigate(-1)} 
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mb-4"
      >
        Back
      </button>
    
      <label className="block text-lg mb-2">Workout Name:</label>
      <input
        type="text"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
        className="w-full p-2 rounded bg-gray-700 text-white mb-4"
      />

      <h2 className="text-2xl font-bold mt-6 mb-2">Exercises</h2>
      <div className="mb-4">
        {availableExercises.map((exercise) => (
          <label key={exercise.id} className="flex items-center px-3 py-2 hover:bg-gray-700 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={selectedExercises.includes(exercise.id)}
              onChange={() =>
                setSelectedExercises((prev) =>
                  prev.includes(exercise.id)
                    ? prev.filter((id) => id !== exercise.id)
                    : [...prev, exercise.id]
                )
              }
              className="mr-2"
            />
            {exercise.name}
          </label>
        ))}
      </div>

      <button onClick={handleSaveWorkout} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mt-4 block">
        Save Workout
      </button>
    </div>
  );
};

export default WorkoutDetails;
