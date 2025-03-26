import React, { useState } from "react";
import { useNavigate, useLoaderData } from "react-router";
import { motion } from "framer-motion";

import type { Workout, Exercise, WorkoutSession } from "~/types"; // Import types for workouts and exercises

import { deleteWorkout } from "~/utils/api/workouts";

export const CustomerDashboard: React.FC = () => {
    const loaderData = useLoaderData<{
        workoutSessions: WorkoutSession[];
        workouts: Workout[];
        exercises: Exercise[];
        userType: string;
    }>();

    const [workouts, setWorkouts] = useState<Workout[]>(loaderData?.workouts || []);
    const exercises: Exercise[] = loaderData?.exercises || [];
    const workoutSessions: WorkoutSession[] = loaderData?.workoutSessions || [];
    const username = localStorage.getItem("username") || "user";
    const navigate = useNavigate();

    const token = localStorage.getItem("accessToken");


    return (
        <>
            {/* Main content */}
            <motion.div
                className="flex flex-row flex-grow bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4"        
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

                {/* Middle Section: Feed */}
                <motion.div className="w-full mb-3">
                    <div className="w-full mb-3">
                        <h3 className="text-lg font-semibold mb-2 text-center">Sessions Performed</h3>
                        {workoutSessions.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center">No History</p>
                        ) : (
                            <ul className="space-y-2 w-full">
                                {workoutSessions.slice().reverse().map((session) => {
                                    const workout = workouts.find((workout) => workout.id === session.workout);
                                    const workoutName = workout ? workout.name : "Unknown Workout";

                                    return (
                                    <li
                                        key={session.id}
                                        className="p-2 bg-gray-700 rounded hover:bg-gray-600 flex flex-col"
                                    >
                                        {/* Display info about the session */}
                                        <p className="font-semibold mb-0">💪 {workoutName}</p>
                                        <div className="flex flex-col">
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
                                                    onClick={() => deleteWorkout(token, workout.id).then(() => setWorkouts(workouts.filter((w) => w.id !== workout.id)))}
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
        </>
    );
};