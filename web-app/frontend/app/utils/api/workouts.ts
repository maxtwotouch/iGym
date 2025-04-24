import { backendUrl } from '~/config'; // Import backendUrl from config
import type { Workout } from "~/types"; // Import type for workouts

// Function to delete a workout
export const deleteWorkout = async (token: string | null, workoutId: number): Promise<Workout[] | null> => {
    if (!token) {
        console.error("Could not delete workout: No access token found");
        return null;
    }
    
    try {
        const response = await fetch(`${backendUrl}/workout/delete/${workoutId}/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
    
        if (!response.ok) {
            console.error("Failed to delete workout");
            return null;
        }
    
        const data = await response.json(); // Assuming the backend returns some confirmation message

        console.log("Workout deleted successfully:", data);

        return data; // Return the response from the backend
    } catch (error) {
        console.error("Error deleting workout:", error);
        return null;
    }
};


 // Fetch workouts from the backend
export const fetchWorkouts = async (token: string | null): Promise<Workout[] | null> => {
    if (!token) {
        console.error("Could not fetch workouts: No access token found");
        return null;
    }

    try {
        const response = await fetch(`${backendUrl}/workout/`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            console.error("Failed to fetch workouts");
            return null;
        }

        const data = await response.json(); 
        
        return data; // Return the fetched workouts
    } catch (error) {
        console.error("Error fetching workouts:", error);
        return null;
    }
};