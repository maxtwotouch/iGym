import type { Route } from "./+types/WorkoutSessionRoute";
import { WorkoutSession } from "~/pages/WorkoutSession";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Welcome to workoutapp!" },
  ];
}

const WorkoutSessionRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  return <WorkoutSession/>;
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

export default WorkoutSessionRoute;