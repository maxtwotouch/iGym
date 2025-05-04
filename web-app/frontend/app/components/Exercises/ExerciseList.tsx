
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { fetchExercises } from "~/utils/api/exercises";
import type { Exercise } from "~/types"; // Import type for exercises

const MUSCLE_CATEGORIES = ["legs", "arms", "shoulders", "back", "abs", "chest"];
const MUSCLE_CATEGORY_MAP: { [key: string]: string } = {
    legs: "Legs",
    arms: "Arms",
    shoulders: "Shoulders",
    back: "Back",
    abs: "Abdominals",
    chest: "Chest",
};

function ExerciseList() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const exercises = await fetchExercises();

            if (!exercises) {
                console.error("Failed to fetch exercises");
                return;
            }

            setExercises(exercises);
        })();
    }, [navigate]);

    // Group exercises by muscle category
    const groupedExercises = MUSCLE_CATEGORIES.reduce((groups, category) => {
        groups[category] = exercises.filter(
            (exercise) => exercise.muscle_category === category
        );
        return groups;
    }, {} as { [key: string]: Exercise[] });

    return (
        <motion.div
            className="min-h-screen text-white flex flex-col items-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            <motion.h1
                className="text-4xl font-bold mb-6"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Exercises
            </motion.h1>
            {/* Exercise Categories */}
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MUSCLE_CATEGORIES.map((category) => (
                    <motion.div
                        key={category}
                        className="bg-gray-800 p-4 rounded-lg shadow-lg"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Category Title */}
                        <h2 className="text-2xl font-semibold mb-4 text-center">
                            {MUSCLE_CATEGORY_MAP[category]}
                        </h2>
                        
                        {/* Categorized Exercise List */}
                        {groupedExercises[category]?.length > 0 ? (
                            <div className="w-full flex-col space-y-2">
                                {groupedExercises[category]
                                // Sort exercises alphabetically
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((exercise) => (
                                    <div
                                        key={exercise.id}
                                        className="w-full max-w-xs mx-auto p-2 bg-gray-700 rounded text-center hover:bg-gray-600 transition cursor-pointer"
                                        data-id={exercise.id}
                                        onClick={() =>
                                            navigate(`/exercises/${exercise.id}`)
                                        }
                                    >
                                        {exercise.name}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center">No exercises available.</p>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

export default ExerciseList;