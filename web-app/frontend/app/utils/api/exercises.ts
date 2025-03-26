import { backendUrl } from '~/config'; // Import backendUrl from config

import type { Exercise } from "~/types"; // Import type for exercises

// Fetch exercises from the backend
export const fetchExercises = async (token: string | null): Promise<Exercise[] | null> => {
    if (!token) {
        console.error("Could not fetch exercises: No access token found");
        return null;
    }

    try {
        const response = await fetch(`${backendUrl}/exercises/`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            console.error("Failed to fetch exercises");
            return null;
        }

        const data = await response.json();
    
        return data; // Return the fetched exercises
    }
    catch (error) {
        console.error("Error fetching exercises:", error);
        return null;
    }
};