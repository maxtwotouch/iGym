import type { Route } from "./+types/CalendarRoute";
import { Calendar } from "../pages/Calendar";
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

const CalendarRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  return <Calendar/>;
}

export const clientLoader = async ({
  params,   
}: Route.LoaderArgs) => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
      return null;
  }
  try {
    return {}
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

export default CalendarRoute;