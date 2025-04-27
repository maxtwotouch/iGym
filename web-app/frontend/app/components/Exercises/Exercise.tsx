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
        <div className="exercise-container">
          <motion.h1
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {exercise.name}
          </motion.h1>
          <h2>Muscle Group: {exercise.muscle_group}</h2>
          <p>{exercise.description}</p>
          <img src={`${exercise.image}`} alt={exercise.name} />
        </div>
      );
};