import type { Route } from "./+types/DashboardRoute";
import { Dashboard } from "../pages/Dashboard";
import LoadingSpinner from "~/components/common/LoadingSpinner";

import { fetchWorkoutSessions } from "~/utils/api/workoutSessions"; // Import the function to fetch workout sessions
import { fetchWorkouts, deleteWorkout } from "~/utils/api/workouts"; // Import the function to fetch workouts
import { fetchExercises } from "~/utils/api/exercises"; // Import the function to fetch exercises

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Your dashboard" },
  ];
}

const DashboardRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  return <Dashboard/>;
}

export const clientLoader = async ({
  params,   
}: Route.LoaderArgs) => {
  try {
      const workoutSessions = await fetchWorkoutSessions();
      const workouts = await fetchWorkouts();
      const exercises = await fetchExercises();

      return { workoutSessions, workouts, exercises };
  } catch (error) {
      console.error("Error loading data:", error);
      return null;
  }
};

export const HydrateFallback = () => {
  return (
      <div className="absolute inset-0 flex justify-center items-center">
          <LoadingSpinner text="Loading Dashboard..." />
      </div>
  );
}

export default DashboardRoute;