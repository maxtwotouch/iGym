import { backendUrl } from '~/config'; // Import backendUrl from config
import type { WorkoutSession } from "~/types"; // Import type for workout sessions

// Fetch workout sessions from the backend
export const fetchWorkoutSessions = async (token: string | null): Promise<WorkoutSession[] | null> => {
    if (!token) {
        console.error("Could not fetch workout sessions: No access token found");
        return null;
    }

    try {
        const response = await fetch(`${backendUrl}/session/workout/`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            console.error("Failed to fetch workout sessions");
            return  null;
        }

        const data = await response.json();

        return data; // Return the fetched workout sessions
    } catch (error) {
        console.error("Error fetching workout sessions:", error);
        return null;
    }
};