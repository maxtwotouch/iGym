import type { Route } from "./+types/DashboardRoute";
import { Dashboard } from "../pages/Dashboard";
import LoadingSpinner from "~/components/common/LoadingSpinner";

import { fetchWorkoutSessions } from "~/utils/api/workoutSessions"; // Import the function to fetch workout sessions
import { fetchWorkouts, deleteWorkout } from "~/utils/api/workouts"; // Import the function to fetch workouts
import { fetchExercises } from "~/utils/api/exercises"; // Import the function to fetch exercises

import { useNavigate } from "react-router";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Welcome to workoutapp!" },
  ];
}

const DashboardRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  const userType = loaderData?.userType;

  console.log(loaderData);

  useEffect(() => {
      if (!userType) {
        const navigate = useNavigate();
        navigate("/login");
      }
    }, [userType]);

  return <Dashboard userType={userType} />;
}

export const clientLoader = async ({
  params,   
}: Route.LoaderArgs) => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
      return null;
  }
  try {
    console.log(localStorage)

      const userType = localStorage.getItem("userType");

      const workoutSessions = await fetchWorkoutSessions(token);
      const workouts = await fetchWorkouts(token);
      const exercises = await fetchExercises(token);

      // Wait for a few seconds to simulate loading (remove this in production)
      await new Promise(resolve => setTimeout(resolve, 2000)); 

      return { workoutSessions, workouts, exercises, userType };
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