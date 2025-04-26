import apiClient from "./apiClient";
import type { WorkoutSession } from "~/types"; // Import type for workout sessions

// Fetch workout sessions from the backend
export const fetchWorkoutSessions = async (): Promise<WorkoutSession[] | null> => {
    try {
        const response = await apiClient.get("/workouts_sessions/");

        if (response.status !== 200) {
            console.error("Failed to fetch workout sessions");
            return  null;
        }

        const data = await response.data;

        return data; // Return the fetched workout sessions
    } catch (error) {
        console.error("Error fetching workout sessions:", error);
        return null;
    }
};