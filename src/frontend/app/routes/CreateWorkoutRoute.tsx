import type { Route } from "./+types/CreateWorkoutRoute";
import CreateWorkout from "../pages/CreateWorkout";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Workout creation" },
    { name: "description", content: "Workout creation page, name your workout and redirect to exercise selection page" },
  ];
}

const CreateWorkoutRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  return <CreateWorkout/>;
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

export default CreateWorkoutRoute;