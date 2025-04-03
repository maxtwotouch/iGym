import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";
import Exercise from "~/components/Exercise";
import Footer from "~/components/Footer";

const ExerciseDetail: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        }, [navigate]);

    return (
        <motion.div className="d-flex flex-column min-vh-100">
            <NavBar />

            <motion.div
                className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center p-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
            
            <Exercise />

            </motion.div>  
            <Footer />
        </motion.div>
    );

};
        
export default ExerciseDetail;