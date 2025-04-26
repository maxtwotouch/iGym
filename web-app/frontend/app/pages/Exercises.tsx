import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import ExerciseList from "~/components/Exercises/ExerciseList"; // Import the ExerciseList component
  

export const Exercises: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        }, [navigate]); // Call the effect whenever the user navigates to a new page

    return (
        <motion.div>
            <motion.div
                className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-xl font-bold text-white">Exercises</h2>
            
                <ExerciseList />
            </motion.div>  
        </motion.div>
    );

};