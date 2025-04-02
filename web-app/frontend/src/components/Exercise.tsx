import { motion } from 'framer-motion';
import {useParams, useNavigate} from "react-router-dom";
import { useState, useEffect } from "react";

// Interface to define the structure of an exercise object
  interface Exercise {
    id: number;
    name: string;
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
              const response = await fetch(`${backendUrl}/exercises/${id}/`, {
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

export default Exercise