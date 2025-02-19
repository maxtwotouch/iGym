import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";

// Interface to define the structure of a workout object
interface Workout {
    id: number;
    name: string;
    date_created: string;
    exercises: number[];
}
  
  // Interface to define the structure of an exercise object
  interface Exercise {
    id: number;
    name: string;
}

const Exercises: React.FC = () => {
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken"); // Retrieve JWT token
        if (!token) { // Redirect to login if token is missing
            navigate("/login");
            return;
        }

        // Fetch available exercises from the backend
        const fetchExercises = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/exercises/", {
                headers: { Authorization: `Bearer ${token}` }, // Include JWT token for authentication so the backend can verify the user's identity
                });
                if (!response.ok) {
                console.error("Failed to fetch exercises");
                return;
                }
                const data = await response.json();
                setAvailableExercises(data); // Store the fetched exercises in the state
            } catch (error) {
                console.error("Error fetching exercises:", error);
            }
            };
        
        fetchExercises();
        }, [navigate]); // Call the effect whenever the user navigates to a new page

        return(
            <motion.div>
                <NavBar/>
                <motion.div
                    className="bg-gray-800 p-4 rounded-lg shadow-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    >
                    <h2 className="text-xl font-bold text-white">Exercises</h2>
                    {availableExercises.length === 0 ? (
                        <p className="mt-2">No exercises found.</p>
                    ) : (
                        availableExercises.map((exercise) => (
                        <div
                            key={exercise.id}
                            className="text-white"
                        >
                            <p className="font-semibold">{exercise.name}</p>
                            <ul className="text-gray-300 mt-2">
                            </ul>
                        </div>
                        ))
                    )}
                </motion.div>
            </motion.div>
        )
    };
        
export default Exercises;


