import { fetchWorkouts } from "./api/workouts";
import { fetchWorkoutSessions } from "./api/workoutSessions";

export const mapWorkoutSessionsToCalendarEvents = async () => {
    try {
        const [workouts, workoutSessions] = await Promise.all([
            fetchWorkouts(),
            fetchWorkoutSessions()
        ]);

        if (!workouts || !workoutSessions) {
            console.error("Failed to fetch workouts or workout sessions");
            return [];
        }

        // Map workout ID to its name for quick lookup
        const workoutMap = new Map(workouts.map((workout: any) => [workout.id, workout.name]));

        // Map workout sessions to calendar events

        // Map workout sessions to calendar events
        const sessionEvents = workoutSessions.map((session: any) => {
            const startTime = new Date(session.start_time);
            let durationMs;
            if (!session.duration) {
              durationMs = 0; // Return 0 milliseconds for invalid duration
            }
  
            else {
              const parts = session.duration.split(":");
  
              // Parse hours, minutes, and seconds
              const hours = parseInt(parts[0], 10) || 0; // Default to 0 if NaN
              const minutes = parseInt(parts[1], 10) || 0; // Default to 0 if NaN
              const seconds = parseInt(parts[2], 10) || 0; // Default to 0 if NaN
  
              durationMs = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
            }
            // Calculate end time
            const endTime = new Date(startTime.getTime() + durationMs);
      
            return {
              id: `session-${session.id}`,
              workout_id: session.workout,
              title: workoutMap.get(session.workout) || "Workout Session",
              start: startTime.toISOString(),
              duration: session.duration,
            };
          });
      
          return sessionEvents;
    } catch (error) {
        console.error("Error fetching workouts or workout sessions:", error);
        return [];
    }


}