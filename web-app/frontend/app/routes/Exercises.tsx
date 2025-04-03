import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";
import ExerciseList from "~/components/ExerciseList";
import Footer from "~/components/Footer";

// Interface to define the structure of a workout object
interface Workout {
    id: number;
    name: string;
    date_created: string;
    exercises: number[];
}
  

const Exercises: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        }, [navigate]); // Call the effect whenever the user navigates to a new page

return (
    <motion.div>
        <NavBar />

        <motion.div
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >

        <ExerciseList />

        <Footer />

        </motion.div>  
    </motion.div>
);

    };
        
export default Exercises;


