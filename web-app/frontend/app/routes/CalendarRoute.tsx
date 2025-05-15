import type { Route } from "./+types/CalendarRoute";
import { Calendar } from "../pages/Calendar";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Calendar" },
    { name: "description", content: "Your personal Calendar, listing all events" },
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