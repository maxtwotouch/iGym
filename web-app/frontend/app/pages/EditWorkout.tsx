import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { motion } from "framer-motion";

import apiClient from "~/utils/api/apiClient";

// Interface to define the structure of an exercise object
interface Exercise {
  id: number;
  name: string;
  description: string;
  muscle_group: string;
}


const EditWorkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [newWorkoutName, setNewWorkoutName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchExercises = async () => {
      try {
          const response = await apiClient.get(`/workout/${id}/exercises/`)
      
          if (response.status != 200) {
            console.error("Failed to fetch exercises");
            return;
          }

          const data = await response.data;
          setSelectedExercises(data);
      } catch (error) {
          console.error("Error fetching exercises:", error);
      }
    };

    const fetchWorkoutData = async () => {
      try {
        const response = await apiClient.get(`/workout/${id}/`)
        
        if (response.status != 200) {
          console.error("Failed to fetch workout");
          return;
        }

        const data = await response.data;
        
        if (!location.state) {
          setNewWorkoutName(data.name);
        }

      } catch (error) {
        console.error("Error fetching workout data:", error);
      }
    };

    const loadData = async () => {
      await fetchExercises();
      await fetchWorkoutData();
      setLoading(false);
    } 

    loadData();
  }, [navigate]); 

  // Updates selected exercises and workout name when navigating back from the exercise selection page
  useEffect(() => { 
    if (!loading && location.state) {
      setSelectedExercises(location.state.selectedExercises);
      setNewWorkoutName(location.state.newWorkoutName);
    };
  }, [loading]);

  const handleSaveWorkout = async () => {
    const exercises = selectedExercises.map((exercise) => exercise.id);

    try {
      const response = await apiClient.put(`/workout/update/${id}/`, 
        {
          name: newWorkoutName,
          exercises: exercises
        }
      );

      const data = await response.data;

      if(response.status != 200) {
        const fieldErrors = [];

        for (const key in data) {
          if (Array.isArray(data[key])) {
            fieldErrors.push(`${key}: ${data[key].join("")}`);
          } else {
            fieldErrors.push(`${key}: ${data[key]}`);
          }
        }

        alert("Edit failed:\n" + fieldErrors.join("\n"));
        return;
      }
    }
    catch (error: any) {
      // Check if the error is due to name validation
      if (error.response?.data?.name) {
        alert(`Validation Error: ${error.response.data.name.join(" ")}`);
        return;
      } 

      else{
        alert(`Error: ${error.response?.data?.detail || error.message}`);
        return;
      }
    }

    navigate("/dashboard");
  };

  const removeExerciseFromWorkout = (exerciseId: number) => {
    setSelectedExercises((prevSelectedExercises) => {
      return prevSelectedExercises.filter((exercise) => exercise.id !== exerciseId);
    });
  };

  return (
    <motion.div className="d-flex flex-column min-vh-100">
      <motion.div
        className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >

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
            name="workoutName"
            type="text"
            value={newWorkoutName}
            onChange={(e) => setNewWorkoutName(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
            required
          />

          {/* Exercises List */}
          <h2 className="text-lg font-semibold mb-2">Exercises</h2>
          {selectedExercises.length === 0 ? (
            <p className="text-gray-400 mb-4">No exercises selected.</p>
          ) : (
            <ul className="list-disc list-inside mb-4">
              {selectedExercises.map((exercise) => {
                return (
                  <motion.li
                    key={exercise.id}
                    className="text-gray-300 flex justify-between items-center p-2 bg-gray-700 rounded-md mb-2"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {exercise ? exercise.name : "Unknown Exercise"}

                    {/* Delete exercise from Exercise List */}
                    <motion.button
                      name="deleteExercise"
                      onClick={() => removeExerciseFromWorkout(exercise.id)}
                      className="btn btn-sm btn-danger ml-4"
                      whileHover={{ scale: 1.05 }}
                    >
                      ✕
                    </motion.button>
                    </motion.li>
                );
              })}
            </ul>
          )}

          {/* Add Exercise Button */}
          <motion.button
            name="editExercises"
            type="button"
            onClick={() => navigate("/workouts/create/exercises", { state: { fromPage: `/workouts/update/${id}/`, selectedExercises, newWorkoutName } })}
            className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 transition mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Add Exercises
          </motion.button>

          {/* Save Button */}
          <motion.button
            name="saveWorkout"
            onClick={handleSaveWorkout}
            className="w-full py-2 mt-4 bg-green-600 hover:bg-green-700 rounded text-white"
            whileHover={{ scale: 1.05 }}
          >
            Save Workout
          </motion.button>
        </motion.div>

        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/dashboard")}
          className="mt-4 text-blue-400 hover:text-blue-500 underline"
          whileHover={{ scale: 1.05 }}
        >
          Back to Dashboard
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default EditWorkout;