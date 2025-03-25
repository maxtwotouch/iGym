// Interface to define the structure of a workout object
export interface Workout {
    id: number;
    name: string;
    date_created: string;
    exercises: number[];
}

// Interface to define the structure of an exercise object
export interface Exercise {
    name: string;
    id: number;
}

// Interface to define the structure of a workout session object
export interface WorkoutSession {
    id: number;
    start_time: string;
    workout: number;
    calories_burned: number;
    exercise_sessions: ExerciseSession[];
}
 
// Interface to define the structure of an exercise set object
export interface ExcerciseSet {
    id: number;
    repetitions: number;
    weight: number;
}

// Interface to define the structure of an exercise session object
export interface ExerciseSession {
    id: number;
    exercise: number;
    sets: ExcerciseSet[];
}