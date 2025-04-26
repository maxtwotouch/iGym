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

  let routeToLogin = false;

  if (!userType) {
    routeToLogin = true;
    return <HydrateFallback />; // Show loading spinner if userType is not available  
  }

  useEffect(() => {
      if (routeToLogin) {
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

      const workoutSessions = await fetchWorkoutSessions();
      const workouts = await fetchWorkouts();
      const exercises = await fetchExercises(token);

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