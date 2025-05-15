import type { Workout } from "~/types"; // Import type for workouts
import apiClient from "./apiClient";

// Function to delete a workout
export const deleteWorkout = async (workoutId: number): Promise<Workout[] | null> => {
    try {
        const response = await apiClient.delete(`/workout/delete/${workoutId}/`);
    
        if (response.status !== 204) {
            console.error("Failed to delete workout");
            return null;
        }
    
        const data = await response.data; // Assuming the backend returns some confirmation message

        console.log("Workout deleted successfully:", data);

        return data; // Return the response from the backend
    } catch (error) {
        console.error("Error deleting workout:", error);
        return null;
    }
};


 // Fetch workouts from the backend
export const fetchWorkouts = async (): Promise<Workout[] | null> => {
    try {
        const response = await apiClient.get("/workout/");

        if (response.status !== 200) {
            console.error("Failed to fetch workouts");
            return null;
        }

        const data = await response.data; 
        
        return data; // Return the fetched workouts
    } catch (error) {
        console.error("Error fetching workouts:", error);
        return null;
    }
};