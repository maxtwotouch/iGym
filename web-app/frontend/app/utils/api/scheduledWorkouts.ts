import apiClient from '~/utils/api/apiClient';

export const fetchScheduledWorkouts = async () => {
    try {
        const response = await apiClient.get('/scheduled_workouts/');

        if (response.status !== 200) {
            throw new Error("Failed to fetch scheduled workouts");
        }

        const scheduledWorkouts = await response.data;
        const now = new Date();

        // Array to hold delete promises
        const deletePromises = [];

        for (const workout of scheduledWorkouts) {
            const workoutDate = new Date(workout.scheduled_date);
            if (workoutDate < now) {
                // If the scheduled workout is in the past, delete it
                const deletePromise = deleteScheduledWorkout(workout.id);
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

export const deleteScheduledWorkout = async (scheduledWorkoutId: number) => {
    try {
        const deletePromise = apiClient.delete(`/scheduled_workout/delete/${scheduledWorkoutId}/`);

        // Return the promise
        return deletePromise;
    } catch (error) {
        console.error(`Error deleting scheduled workout with id: ${scheduledWorkoutId}. Error: `, error);
        return null;
    }
    
}

export const createScheduledWorkout = async (workoutId: number, scheduledDate: string) => {
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
        const response = await apiClient.post('/scheduled_workout/create/', postData);

        if (response.status !== 201) {
            throw new Error("Failed to schedule workout");
        }

        const newSession = await response.data;

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

