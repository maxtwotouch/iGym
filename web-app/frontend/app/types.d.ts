// Interface to define the structure of a workout object
export interface Workout {
    id: number;
    name: string;
    date_created: string;
    exercises: number[];
}

// Interface to define the structure of an exercise object
interface Exercise {
    id: number;
    name: string;
    muscle_category: string;
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
export interface Set {
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

type Notification = {
    id: number;
    sender: string;
    chat_room_id: number;
    chat_room_name: string;
    date_sent: Date;
    message: string | null;
    workout_message: string | null; // Name of the workout
  };
  
  type chatRoom = {
    id: number;
  }

  type User = {
    id: number;
    username: string;
  };


