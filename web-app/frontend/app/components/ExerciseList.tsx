
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

  // Interface to define the structure of an exercise object
  interface Exercise {
    id: number;
    name: string;
}

function ExerciseList() {
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [selectedExercise, setSelectedexercise] = useState<number | null>(null); // Track selected exercise
    const [searchQuery, setSearchQuery] = useState<string>(""); // State for the search query
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken"); // Retrieve JWT token

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
                console.log("Fetched Exercises:", data);
            } catch (error) {
                console.error("Error fetching exercises:", error);
            }
            };
        
        fetchExercises();
        }, [navigate]); // Call the effect whenever the user navigates to a new page

        // Handle search input change
        const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchQuery(e.target.value);
        }

        // Filter exercises based on the search query
        const filteredexercises = availableExercises.filter((exercise) =>
            exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <div className="mx-4">
            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full max-w-lg p-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
                />
        </div>


            <ul className="w-full max-w-lg bg-gray-800 text-white p-4 rounded-lg shadow-md mx-0 ml-4">
                {filteredexercises.length > 0 ? (
                    filteredexercises.map((exercise, index) => (
                        <li
                            key={exercise.id}
                            className="cursor-pointer p-2 bg-gray-600 rounded-md mb-2 text-left hover:bg-gray-500 transition"
                            onClick={() => setSelectedexercise(exercise.id === selectedExercise ? null : exercise.id)}
                        >
                            <span className="font-semibold">{exercise.name}</span>

                            {selectedExercise === exercise.id && (
                                <div className="mt-2">
                                    <motion.button
                                        onClick={() => navigate(`/exercises/${exercise.id}`)}
                                        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        More Info
                                    </motion.button>
                                </div>
                            )}
                        </li>
                    ))
                ) : (
                    <li className="list-group-item">Loading exercises...</li>
                )}
            </ul>
        </div>
    );
}

export default ExerciseList;