import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";
import Footer from "~/components/Footer";
import 'tailwindcss/tailwind.css';
import 'bootstrap/dist/css/bootstrap.css';
import ExerciseSearchBar from "~/components/ExerciseSearchBar";
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'; // Vite environment variable for testing or default localhost URL

  
// Interface to define the structure of an exercise object
interface Exercise {
    name: string;
    id: number;
}


const ExerciseSelection: React.FC = () => {
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
    const [newWorkoutName, setNewWorkoutName] = useState<string>("");
    const [fromPage, setFromPage] = useState<string>(``);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem("accessToken"); // Retrieve JWT token
        if (!token) { 
            navigate("/login"); 
            return;
        }

        console.log("backend url, ", backendUrl);


        const fetchExercises = async () => {
            try {
                const response = await fetch(`${backendUrl}/exercises/`, {
                headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Response status:", response.status);
                if (!response.ok) {
                console.error("Failed to fetch exercises");
                return;
                }
                console.log(localStorage.getItem("accessToken"));
                const data = await response.json();
                console.log("Exercises received:", data); 
                setAvailableExercises(data); 
            } catch (error) {
                console.error("Error fetching exercises:", error);
            }
        };

        if (location.state) {
            setFromPage(location.state.fromPage);
            setSelectedExercises(location.state.selectedExercises);
            setNewWorkoutName(location.state.newWorkoutName);
        }

        fetchExercises();
    }, [navigate]); 

    const filteredExercises = availableExercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectExercise = (exerciseId: number) => {
        setSelectedExercises((prevSelectedExercises) => {
            if (prevSelectedExercises.includes(exerciseId)) {
                return prevSelectedExercises.filter((id) => id !== exerciseId);
            } else {
                return [...prevSelectedExercises, exerciseId];
            }
        });
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
                {/* Title */}
                <motion.h1
                    className="text-3xl font-bold mb-6"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    Select Exercises
                </motion.h1>

                {/* Exercise Search Bar */}
                <motion.div className="w-80 mb-4">
                    <ExerciseSearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                </motion.div>

                {/* Exercise List */}
                <motion.div
                    className="bg-gray-800 p-6 rounded-lg shadow-md w-80"
                    id="exerciseList"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-xl font-bold mb-2">Available Exercises</h2>
            
                    {filteredExercises.length > 0 ? (
                        <motion.ul>
                            {filteredExercises.map((exercise) => (
                                <motion.li
                                    key={exercise.id}
                                    data-id={exercise.id}
                                    className={`cursor-pointer p-2 rounded-md mb-2 text-left transition ${
                                        selectedExercises.includes(exercise.id) 
                                            ? "bg-blue-500 text-white" // Highlighted when selected
                                            : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelectExercise(exercise.id)}
                                >
                                    {exercise.name}
                                </motion.li>
                            ))}
                        </motion.ul>

                    ) : (
                        <h2 className="text-sm text-gray-400">No exercises found.</h2>
                    )}

                    {/* Confirm Selection Button */}
                    <motion.button
                        name="confirmSelectionButton"
                        onClick={() => navigate(fromPage, { state: { selectedExercises, newWorkoutName } })}
                        className="w-full py-2 mt-4 bg-blue-600 hover:bg-blue-700 rounded text-white"
                        whileHover={{ scale: 1.05 }}
                    >
                        Confirm Selection
                    </motion.button>
                </motion.div>
            </motion.div>
            <Footer />
        </motion.div>
    );
};  


export default ExerciseSelection;