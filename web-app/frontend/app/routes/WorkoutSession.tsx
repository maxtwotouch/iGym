import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";
import Footer from "~/components/Footer";
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
import 'bootstrap/dist/css/bootstrap.css';
// Interfaces for Exercise and Workout Sessions
interface Exercise {
    name: string;
    id: number;
    calories: number;
}

// Interface for a workout exercise session
interface WorkoutExerciseSession {
    exercise: number;
    sets: { id: number; weight: string; repetitions: string }[];
}

const WorkoutSession: React.FC = () => {
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [exercisesWorkout, setExercisesWorkout] = useState<number[]>([]);
    const [workoutExerciseSessions, setWorkoutExerciseSessions] = useState<WorkoutExerciseSession[]>([]);
    const { id } = useParams(); 
    const navigate = useNavigate(); 
    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        setIsRunning(true);
        const fetchWorkout = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(`${backendUrl}/workouts/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    console.error("Failed to fetch workout details");
                    return;
                }
                const data = await response.json();
                setExercisesWorkout(data.exercises);
                setWorkoutExerciseSessions(data.exercises.map((exerciseId: number) => ({
                    exercise: exerciseId,
                    sets: [{ id: Date.now(), weight: "", repetitions: "" }],
                })));
            } catch (error) {
                console.error("Error fetching workout details:", error);
            }
        };

        // This function will be called every second (since 1000 milliseconds = 1 second)
        const interval = setInterval(() => {
            if (isRunning) {
                setTimer(prev => prev += 1);
            }
        }, 1000);

        const fetchExercises = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                navigate("/login");
                return;
            }
            try {
                const response = await fetch(`${backendUrl}/exercises/`, {
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

        fetchExercises();
        fetchWorkout();
        return () => clearInterval(interval);
    }, [navigate, isRunning]);

    // Function to add a set
    const addSet = (exerciseId: number) => {
        setWorkoutExerciseSessions(prev => prev.map(session =>
            session.exercise === exerciseId
                ? { ...session, sets: [...session.sets, { id: Date.now(), weight: "", repetitions: "" }] }
                : session
        ));
    };

    // Function to remove a set
    const removeSet = (exerciseId: number, setId: number) => {
        setWorkoutExerciseSessions(prev => prev.map(session =>
            session.exercise === exerciseId
                ? { ...session, sets: session.sets.filter(set => set.id !== setId) }
                : session
        ));
    };

    const handleInputChange = (exerciseId: number, setId: number, field: "weight" | "repetitions", value: string) => {
        if (!/^\d*$/.test(value)) return; // Prevent non-numeric input
        let newValue = value.replace(/^0+/, ""); // Remove leading zeros

        // If empty, set to empty string. This allows for clearing the input
        if (newValue === "") {
            setWorkoutExerciseSessions(prev => {
                return prev.map(session =>
                    session.exercise === exerciseId
                        ? {
                            ...session,
                            sets: session.sets.map(set =>
                                set.id === setId ? { ...set, [field]: "" } : set
                            ),
                        }
                        : session
                )
            });
        }

        // If input is longer than 5 digits, set it to max
        if (newValue.length > 5) {
            setWorkoutExerciseSessions(prev => {
                return prev.map(session =>
                    session.exercise === exerciseId
                        ? {
                            ...session,
                            sets: session.sets.map((set) =>
                                set.id === setId ? { ...set, [field]: 99999 } : set
                            ),
                        }
                        : session
                )
            });
        }

        console.log(newValue);
        
        const numValue = Number(newValue); // Convert to number, for testing
        if (isNaN(numValue) || numValue < 1 || numValue > 99999) return;

        // Update the state with a fresh reference
        setWorkoutExerciseSessions(prev => {
            return prev.map(session =>
                session.exercise === exerciseId
                    ? {
                        ...session,
                        sets: session.sets.map(set =>
                            set.id === setId ? { ...set, [field]: numValue.toString() } : set
                        ),
                    }
                    : session
            );
        });
    };

    const createWorkoutSession = async (token: string, totalCalories: number): Promise<number | null> => {
        try {
            const response = await fetch(`${backendUrl}/workout/session/create/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    workout: id,
                    calories_burned: totalCalories
                }),
        });

        if (!response.ok) {
            console.error("Failed to create workout session");
            return null;
        }

        const data = await response.json();
        return data.id;
        
        } catch(error) {
            console.error("Error creating workout session:", error);
            return null;

        }
    };

    const createSets = async (token: string, exerciseSessionId: number, sets: { weight: string, repetitions: string }[]) => {
        try {
            const requests = sets.map(set => {
                return fetch(`${backendUrl}/set/create/`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        exercise_session: exerciseSessionId,
                        weight: Number(set.weight),
                        repetitions: Number(set.repetitions),
                    }),
                });
            });
            
            const responses = await Promise.all(requests);
            const allSuccessful = responses.every(response => response.ok);

            if (!allSuccessful) {
                console.error("Failed to create one or more sets");
                return false;
            }

            console.log(`All sets for ExerciseSession ${exerciseSessionId} created successfully`);
            return true;
        
        } catch (error) {
            console.error("Error creating sets:", error);
            return false;
        }
    };

    const createExerciseSessions = async (token: string, workoutSessionId: number): Promise<number | null> => {
        try {
            const requests = workoutExerciseSessions.map(async session => {
                const response = await fetch(`${backendUrl}/exercise/session/create/`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ 
                        exercise: session.exercise,
                        workout_session: workoutSessionId,
                    }),
                });
                
                if(!response.ok) {
                    console.error("Failed to create exercise session for exercise", session.exercise);
                    return null;
                }

                const data = await response.json();
                console.log("Exercise Session Created:", data);
                
                //  Create sets for this exercise session
                await createSets(token, data.id, session.sets);

                return data.id;
            });
        
            const exerciseSessionIds = await Promise.all(requests);
            if (!exerciseSessionIds.every(id => id !== null)) {
                console.error("Some exercise sessions failed to create");
                alert("Some exercise sessions failed to create");
                return null;
            }

            console.log("All exercise sessions created successfully.");
            return null;
        
        } catch (error) {
            console.error("Error creating exercise sessions:", error);
            return null;
        }
    };

    const calculateTotalCalories = () => {
        let totalCalories = 0;
        let MET = 3.0

        const weight = localStorage.getItem("weight");

        // Check that  weigth is not an empty string, null, undefined, 0 or NaN and convert it to a float
        const weightValue = weight ? parseFloat(weight) : 0;
        
        totalCalories = MET * weightValue * (timer / 3600);

        return totalCalories;
    }

    const handleLogSession = async (e: React.FormEvent<HTMLFormElement>) => {
        console.log("Handling log session");
        e.preventDefault();

        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login");
            return;
        }

        const totalCaloriesBurned = calculateTotalCalories();
        console.log("total calories burned: ", totalCaloriesBurned);

        const workoutSessionId = await createWorkoutSession(token, totalCaloriesBurned);

        if(!workoutSessionId) {
            alert("Failed to create workout session. Please try again."); 
            return;
        }

        await createExerciseSessions(token, workoutSessionId);

        navigate("/dashboard");
    };

    return (
        <motion.div className="d-flex flex-column min-vh-100">
            <NavBar />
            <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white">
                <motion.h1 
                    className="text-4xl font-bold mt-6 mb-6" 
                    initial={{ y: -20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    transition={{ duration: 0.8 }}
                >
                    Log Workout Session
                </motion.h1>

                <div className="absolute top-16 right-2 text-lg bg-gray-800 p-2 rounded">
                    Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </div>

                <motion.form 
                    className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    onSubmit={handleLogSession}
                    initial={{ scale: 0.8 }} 
                    animate={{ scale: 1 }} 
                    transition={{ duration: 0.5 }}
                >
                    {exercisesWorkout.length === 0 ? (
                        <p className="text-gray-400">No exercises found.</p>
                    ) : (
                        workoutExerciseSessions.map(session => {
                            const exercise = availableExercises.find(ex => ex.id === session.exercise);
                            const exerciseName = exercise ? exercise.name : "Unknown Exercise";
                            return (
                                <motion.div 
                                    key={session.exercise} 
                                    className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col items-center"
                                >
                                    <motion.h2 
                                        className="text-lg font-semibold mb-4"
                                    >
                                        {exercise ? exercise.name : "Unknown Exercise"} 
                                    </motion.h2>
                                    {session.sets.map((set, index) => (
                                        <motion.div key={set.id} className="w-full mb-4">
                                            <motion.h3 
                                                className="text-md font-medium"
                                            >
                                                Set {index + 1}
                                            </motion.h3>
                                            {/* Input for weight */}
                                            <input 
                                                name={`weight-${exerciseName}-${index + 1}`}
                                                type="string" 
                                                placeholder="Weight (kg)" 
                                                className="w-full p-2 rounded bg-gray-600 text-white mb-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                                                value={set.weight}
                                                onChange={(e) => handleInputChange(session.exercise, set.id, "weight", e.target.value)}
                                            />
                                            {/* Input for repetitions */}
                                            <input 
                                                name={`reps-${exerciseName}-${index + 1}`}
                                                type="string" 
                                                placeholder="Repetitions" 
                                                className="w-full p-2 rounded bg-gray-600 text-white mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={set.repetitions}
                                                onChange={(e) => handleInputChange(session.exercise, set.id, "repetitions", e.target.value)}
                                            />
                                            {/* Remove set Button */}
                                            <motion.button 
                                                type="button" 
                                                className="w-full py-2 bg-red-600 rounded hover:bg-red-700 transition" 
                                                onClick={() => removeSet(session.exercise, set.id)}
                                            >
                                                Remove Set
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                    {/* Add set Button */}
                                    <motion.button 
                                        name={`addSet-${exerciseName}`} 
                                        type="button" 
                                        className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 transition" 
                                        onClick={() => addSet(session.exercise)}
                                    >
                                        Add Set
                                    </motion.button>
                                </motion.div>
                            );
                        })
                    )}
                    {/* Save Button */}
                    <motion.div className="w-full col-span-full flex justify-center mt-6">
                        <motion.button 
                            name="saveButton"
                            type="submit"
                            className="w-64 py-2 bg-green-600 rounded hover:bg-green-700 transition"
                            whileHover={{ scale: 1.05 }}
                        >
                            Save Session
                        </motion.button>
                    </motion.div>
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
            <Footer />
        </motion.div>
    );
};

export default WorkoutSession;