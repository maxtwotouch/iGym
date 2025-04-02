import { backendUrl } from '~/config'; // Import backendUrl from config

export const fetchScheduledWorkouts = async (token: string | null) => {
    if (!token) {
        console.error("Could not fetch scheduled workouts: No access token found");
        return null;
    }

    try {
        const response = await fetch(`${backendUrl}/scheduled_workouts/`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch scheduled workouts");
        }

        const scheduledWorkouts = await response.json();
        const now = new Date();

        // Array to hold delete promises
        const deletePromises = [];

        for (const workout of scheduledWorkouts) {
            const workoutDate = new Date(workout.scheduled_date);
            if (workoutDate < now) {
                // If the scheduled workout is in the past, delete it
                const deletePromise = deleteScheduledWorkout(token, workout.id);
                deletePromises.push(deletePromise);
                // Remove the workout from the data array to avoid refetching to get the updated list
                scheduledWorkouts.splice(scheduledWorkouts.indexOf(workout), 1);
            }
        }

        // Wait for all delete promises to resolve
        await Promise.all(deletePromises);

        return scheduledWorkouts.map((workout: any) => ({
            id: `scheduled-${workout.id}`,
            workout_id: workout.workout_template,
            title: workout.workout_title,
            start: workout.scheduled_date,
        }));

    } catch (error) {

    }
}

export const deleteScheduledWorkout = async (token: string | null, scheduledWorkoutId: number) => {
    if (!token) {
        console.error("Could not delete scheduled workout: No access token found");
        return null;
    }

    try {
        // Hold the promise for the delete operation
        const deletePromise = fetch(`${backendUrl}/scheduled_workout/delete/${scheduledWorkoutId}/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        // Return the promise
        return deletePromise;
    } catch (error) {
        console.error(`Error deleting scheduled workout with id: ${scheduledWorkoutId}. Error: `, error);
        return null;
    }
    
}

export const createScheduledWorkout = async (token: string | null, workoutId: number, scheduledDate: string) => {
    if (!token) {
        console.error("Could not create scheduled workout: No access token found");
        return null;
    }

    // Convert local date/time from input to full ISO string
    const fullDate = new Date(scheduledDate);
    const isoDateTime = fullDate.toISOString();

    // Check if the selected date is in the past
    const now = new Date();
    if (fullDate < now) {
      alert("You cannot schedule a workout in the past."); // Set error message
      return;
    }

    const postData = {
        workout_template: workoutId,
        scheduled_date: isoDateTime
    };

    try {
        const response = await fetch(`${backendUrl}/scheduled_workout/create/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            throw new Error("Failed to schedule workout");
        }

        const newSession = await response.json();

        return {
            id: `scheduled-${newSession.id}`,
            workout_id: newSession.workout_template,
            title: newSession.workout_title,
            start: newSession.scheduled_date,
        };
    } catch (error) {
        console.error("Error scheduling workout:", error);
        return null;
    }
}

