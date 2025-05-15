import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

import { Exercise } from "~/components/Exercises/Exercise";

export const ExerciseDetail: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        }, [navigate]);

    return (
            // Page for exercise details
            <motion.div
                className="min-h-screen bg-gray text-white p-8 flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Exercise />
            </motion.div>  
    );

};