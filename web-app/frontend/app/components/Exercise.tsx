import { motion } from 'framer-motion';
import {useParams, useNavigate} from "react-router-dom";
import React, { useState, useEffect } from "react";
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// Interface to define the structure of an exercise object
  interface Exercise {
    id: number;
    name: string;
    muscle_category: string;
    muscle_group: string
    description: string
    image: string //Url
}

function Exercise() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [exercise, setExercise] = useState<Exercise | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken"); // Retrieve JWT token
        if (!token) {
          navigate("/login"); 
          return;
        }

        const fetchExerciseData = async () => {
            try {
              const response = await fetch(`${backendUrl}/exercise/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!response.ok) {
                console.error("Failed to fetch workout data");
                return;
              }
      
              const data = await response.json();
              setExercise(data)
      
            } catch (error) {
              console.error("Error fetching workout data:", error);
            }
          };
        
            fetchExerciseData()
        },  [id, navigate]); 
    
    // If exercise is not loaded yet, show a loading message
    if (!exercise) {
        return (
          <div className="min-h-screen flex items-center justify-center text-white">
            <p>Loading exercise data...</p>;
          </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center p-6">
          {/* Exercise Details */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl">
            
            {/* Exercise Title */}
            <motion.h1
              className="text-4xl font-bold mb-4 text-white text-center"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {exercise.name}
            </motion.h1>
            
            {/* Exercise Image */}
            <div className="flex justify-center mb-6">
              <img
                src={`${exercise.image}`}
                alt={exercise.name}
                className="rounded-lg max-w-full h-auto object-cover"
                style={{ maxHeight: "300px", maxWidth: "300px" }}
              />
            </div>
            {/* Muscle Group */}
            <h2 className="text-2xl font-semibold mb-4">
              Muscle Groups: {" "}
              <span className="font-normal text-white">
                {exercise.muscle_group}
              </span>
            </h2>
          
            {/* Exercise Description */}
            <h2 className="text-2xl font-semibold mb-1">
              Execution
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {exercise.description}
            </p>
            </div>
        </div>
      );
};

export default Exercise