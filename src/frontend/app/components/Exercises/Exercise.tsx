import { motion } from 'framer-motion';
import {useParams, useNavigate} from "react-router";
import { useState, useEffect } from "react";
import apiClient from '~/utils/api/apiClient';


// Interface to define the structure of an exercise object
  interface Exercise {
    id: number;
    name: string;
    muscle_group: string
    description: string
    image: string //Url
}

export const Exercise = () => {
    const { id } = useParams<{ id: string }>();
    const [exercise, setExercise] = useState<Exercise | null>(null);

    useEffect(() => {
        const fetchExerciseData = async () => {
            try {
              const response = await apiClient.get(`/exercise/${id}/`);
              
              if (response.status !== 200) {
                console.error("Failed to fetch exercise data");
                return;
              }
      
              const data = await response.data;
              setExercise(data)
      
            } catch (error) {
              console.error("Error fetching workout data:", error);
            }
          };
        
            fetchExerciseData()
        },  [id]); 
    
    // If exercise is not loaded yet, show a loading message
    if (!exercise) {
        return <p>Loading exercise data...</p>;
    }

        return (
            // Main container for the exercise details
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl">
              
              {/* Exercise Name */}
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
          );
        };