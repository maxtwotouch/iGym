import type { Route } from "./+types/WorkoutSessionRoute";
import WorkoutSession from "~/pages/WorkoutSession";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Workout Session" },
    { name: "description", content: "Log your workout sessions" },
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