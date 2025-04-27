import type { Route } from "./+types/SelectPTRoute";
import { SelectPT } from "~/pages/SelectPT";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Welcome to workoutapp!" },
  ];
}

const SelectPTRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  return <SelectPT/>;
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

export default SelectPTRoute;