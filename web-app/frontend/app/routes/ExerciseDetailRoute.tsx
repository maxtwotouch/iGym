import type { Route } from "./+types/ExerciseDetailRoute";
import { ExerciseDetail } from "../pages/ExerciseDetail";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Exercise detail" },
    { name: "description", content: "Exercise detail page" },
  ];
}

const ExerciseDetailRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  return <ExerciseDetail/>;
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

export default ExerciseDetailRoute;