import type { Route } from "./+types/ExercisesRoute";
import { Exercises } from "../pages/Exercises";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Exercises" },
    { name: "description", content: "View all existing exercises" },
  ];
}

const ExercisesRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  return <Exercises/>;
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

export default ExercisesRoute;