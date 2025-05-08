import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "framer-motion";
import apiClient from "~/utils/api/apiClient";

// Interface to define the structure of an exercise object
interface Exercise {
  id: number;
  name: string;
}


const CreateWorkout: React.FC = () => {
    const [newWorkoutName, setNewWorkoutName] = useState<string>(""); 
    const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (location.state) {
        setSelectedExercises(location.state.selectedExercises);
        setNewWorkoutName(location.state.newWorkoutName);
      }
    }, []);

  const handleAddWorkout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const exercises = selectedExercises.map((exercise) => exercise.id);

    try {
      const response = await apiClient.post(`/workout/create/`,
        {
          name: newWorkoutName,
          exercises: exercises,
        }
      );

      const data = await response.data;

      if(response.status != 201) {
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

      navigate("/dashboard");

    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        alert("Invalid workout name. Please try a different name.");
      }
      else {
        console.error("Error adding workout:", error);
        alert("An unexpected error occurred.");
      }
    }
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
          className="text-4xl font-bold mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Create New Workout
        </motion.h1>

        <motion.form
          onSubmit={handleAddWorkout}
          className="bg-gray-800 p-8 rounded-lg shadow-md w-80"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Workout Name Input */}
          <input
            name="workoutName"
            type="text"
            placeholder="Workout Name"
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
                    className="text-gray-300"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {exercise ? exercise.name : "Unknown Exercise"}
                  </motion.li>
                );
              })}
            </ul>
          )}

          {/* Add Exercise Button */}
          <motion.button
            name="addExercisesButton"
            type="button"
            onClick={() => navigate("/workouts/create/exercises", { state: { fromPage: `/workouts/create`, selectedExercises, newWorkoutName } })}
            className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 transition mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Add Exercises
          </motion.button>

          {/* Create Workout Button */}
          <motion.button
            name="createWorkoutButton"
            type="submit"
            className="w-full py-2 bg-green-600 rounded hover:bg-green-700 transition"
            whileHover={{ scale: 1.05 }}
          >
            Create Workout
          </motion.button>
        </motion.form>

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

export default CreateWorkout;