import React, { useState, useEffect } from "react";
import { useNavigate, useLoaderData } from "react-router";
import { motion } from "framer-motion";

import type { Workout, Exercise, WorkoutSession } from "~/types"; // Import types for workouts and exercises

import { deleteWorkout } from "~/utils/api/workouts"; // Import the function to delete workouts

export const TrainerDashboard: React.FC = () => {
    const loaderData = useLoaderData<{
        workouts: Workout[];
        exercises: Exercise[];
        userType: string;
    }>();

    const [workouts, setWorkouts] = useState<Workout[]>(loaderData.workouts || []);
    const exercises = loaderData.exercises || [];
    const username = localStorage.getItem("username") || "trainer";
    const navigate = useNavigate();

    const token = localStorage.getItem("accessToken");
  
    return (
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
                                className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 cursor-pointer relative"
                                whileHover={{ scale: 1.02 }}
                            >
                                {/* Delete workouts from Workout List */}
                                <motion.button
                                    onClick={() => deleteWorkout(token, workout.id).then(() => {
                                        setWorkouts((prevWorkouts) =>
                                            prevWorkouts.filter((w) => w.id !== workout.id)
                                        );
                                    })}
                                    className="btn btn-danger absolute top-0 right-0 m-2"
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
    );
};