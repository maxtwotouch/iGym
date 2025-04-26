import type { Route } from "./+types/ClientRoute";
import Client from "../pages/Client";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Client" },
    { name: "description", content: "Client dashboard with calendar view" },
  ];
}

const ClientRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  return <Client />;
};

export const clientLoader = async ({
  params,
}: Route.LoaderArgs) => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return null;
  }

  try {
    return {}; // Optional: fetch and preload client-specific metadata if needed
  } catch (error) {
    console.error("Error loading client route data:", error);
    return null;
  }
};

export const HydrateFallback = () => {
  return (
    <div className="absolute inset-0 flex justify-center items-center">
      <LoadingSpinner text="Loading Client Dashboard..." />
    </div>
  );
};

export default ClientRoute;
