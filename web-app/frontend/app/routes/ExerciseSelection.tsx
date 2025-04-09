import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";
import Footer from "~/components/Footer";
import ExerciseSearchBar from "~/components/ExerciseSearchBar";

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'; // Vite environment variable for testing or default localhost URL

  
// Interface to define the structure of an exercise object
interface Exercise {
    name: string;
    id: number;
    muscle_category: string;
}

const MUSCLE_CATEGORIES = ["legs", "arms", "shoulders", "back", "abs", "chest"];
const MUSCLE_CATEGORY_MAP: { [key: string]: string } = {
    legs: "Legs",
    arms: "Arms",
    shoulders: "Shoulders",
    back: "Back",
    abs: "Abdominals",              
    chest: "Chest",
};


const ExerciseSelection: React.FC = () => {
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
    const [newWorkoutName, setNewWorkoutName] = useState<string>("");
    const [fromPage, setFromPage] = useState<string>(``);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<string>("asc");
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

    const filteredExercises = availableExercises
        .filter((exercise) =>
            exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter((exercise) =>
            filterCategory === "all" || exercise.muscle_category === filterCategory
        )   
        .sort((a, b) =>
            sortOrder === "asc"
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name)
    );

    const handleSelectExercise = (exercise: Exercise) => {
        setSelectedExercises((prevSelectedExercises) => {
            if (prevSelectedExercises.includes(exercise)) {
                return prevSelectedExercises.filter((e) => e.id !== exercise.id);
            } else {
                return [...prevSelectedExercises, exercise];
            }
        });
    };

    return (
        <motion.div className="dmin-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col">
            <NavBar />
            <motion.div
                className="flex flex-col items-center justify-center p-8"
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
                    Select Exercises
                </motion.h1>

                {/* Exercise Search Bar */}
                <motion.div className="flex flex-col w-full max-w-md mb-6 space-y-3">
                    <ExerciseSearchBar 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                />
                    {/* Filter and Sort Section */}
                    <div className="flex space-x-4 justify-center">
                        {/* Filter Dropdown */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="flex-1 p-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
                        >
                            <option value="all">All Types</option>
                            {Object.entries(MUSCLE_CATEGORY_MAP).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value}
                                </option>
                            ))}
                        </select>
                        {/* Sort Dropdown */}
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="flex-1 p-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
                        >
                            <option value="asc">A-Z</option>
                            <option value="desc">Z-A</option>
                        </select>
                    </div>
                </motion.div>

                {/* Exercise List */}
                <motion.div
                    className="bg-gray-800 p-6 rounded-lg shadow-md w-1/3"
                    id="exerciseList"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {filteredExercises.length > 0 ? (
                        <motion.div>
                            {filteredExercises.map((exercise) => (
                                <motion.div
                                    key={exercise.id}
                                    data-id={exercise.id}
                                    className={`cursor-pointer p-2 rounded-md mb-2 text-left transition ${
                                        selectedExercises.includes(exercise) 
                                            ? "bg-blue-500 text-white" // Highlighted when selected
                                            : "bg-gray-700 hover:bg-gray-600 text-white"
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelectExercise(exercise)}
                                >
                                    {exercise.name}
                                </motion.div>
                            ))}
                        </motion.div>

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