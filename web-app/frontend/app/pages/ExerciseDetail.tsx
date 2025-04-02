import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Exercise } from "~/components/Exercises/Exercise";

export const ExerciseDetail: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        }, [navigate]);

    return (
            <motion.div
                className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-xl font-bold text-white">Exercise</h2>
            
                <Exercise />
            

            </motion.div>  
    );

};