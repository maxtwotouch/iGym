import type { Route } from "./+types/ExerciseSelectionRoute";
import ExerciseSelection from "../pages/ExerciseSelection";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Exercise selection" },
    { name: "description", content: "Select exercises to modify or add to your workout" },
  ];
}

const ExerciseSelectionRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  return <ExerciseSelection/>;
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

export default ExerciseSelectionRoute;