import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";
import Footer from "~/components/Footer";
import 'tailwindcss/tailwind.css';
import 'bootstrap/dist/css/bootstrap.css';

  
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
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem("accessToken"); // Retrieve JWT token
        if (!token) { 
            navigate("/login"); 
            return;
        }

        const fetchExercises = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/exercises/", {
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

        if (location.state) {
            setFromPage(location.state.fromPage);
            setSelectedExercises(location.state.selectedExercises);
            setNewWorkoutName(location.state.newWorkoutName);
        }

        fetchExercises();
    }, [navigate]); 

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
        
            {/* Exercise List */}
            <motion.div
                className="bg-gray-800 p-6 rounded-lg shadow-md w-80"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-xl font-bold mb-2">Available Exercises</h2>
        
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
                        onChange={() => handleSelectExercise(exercise.id)}
                        className="mr-2"
                        />
                        {exercise.name}
                    </label>
                    ))}
                </div>
                )}
        
                {/* Confirm Selection Button */}
                <motion.button
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