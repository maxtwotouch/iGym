import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";
import Footer from "~/components/Footer";


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
  const { id } = useParams<{ id: string }>();
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
  const [workoutName, setWorkoutName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:8000/workouts/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          console.error("Failed to fetch workout details");
          return;
        }

        const data = await response.json();
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
  }, [navigate]); 

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
        const errorData = await response.json();
        console.error("Failed to save workout:", errorData);
        return;
      }
    }
    catch (error) {
      console.error("Error saving workout:", error);
    }

    navigate("/dashboard");
  };

  return (
    <motion.div className="d-flex flex-column min-vh-100">
      <NavBar />
      <motion.div
        className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/dashboard")}
          className="w-40 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white mb-4"
          whileHover={{ scale: 1.05 }}
        >
          Back
        </motion.button>

        {/* Title */}
        <motion.h1
          className="text-3xl font-bold mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Edit Workout
        </motion.h1>

        {/* Workout Name Input */}
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-md w-80"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <label className="block text-lg mb-2">Change Workout Name:</label>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
            required
          />

          {/* Exercise List */}
          <h2 className="text-xl font-bold mt-4 mb-2">Exercises</h2>
          {availableExercises.length === 0 ? (
            <p className="text-sm text-gray-400">No exercises available.</p>
          ) : (
            <div className="space-y-2">
              {availableExercises.map((exercise) => (
                <label
                  key={exercise.id}
                  className="flex items-center p-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer"
                >
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
          )}

          {/* Save Button */}
          <motion.button
            onClick={handleSaveWorkout}
            className="w-full py-2 mt-4 bg-green-600 hover:bg-green-700 rounded text-white"
            whileHover={{ scale: 1.05 }}
          >
            Save Workout
          </motion.button>
        </motion.div>
      </motion.div>
      <Footer />
    </motion.div>
  );
};

export default WorkoutDetails;
