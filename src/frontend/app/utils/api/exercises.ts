import apiClient from "./apiClient";

import type { Exercise } from "~/types"; // Import type for exercises

// Fetch exercises from the backend
export const fetchExercises = async (): Promise<Exercise[] | null> => {
    try {
        const response = await apiClient.get("/exercise/");

        if (response.status !== 200) {
            console.error("Failed to fetch exercises");
            return null;
        }

        const data = await response.data;
    
        return data; // Return the fetched exercises
    }
    catch (error) {
        console.error("Error fetching exercises:", error);
        return null;
    }
};