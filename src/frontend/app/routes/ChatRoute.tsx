import type { Route } from "./+types/ChatRoute";
import Chat  from "../pages/Chat";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chat" },
    { name: "description", content: "Create and join Chat Rooms from the sidebar. And send messages or workouts through each invidual Chat Room" },
  ];
}

const ChatRoute = ({
  loaderData,
}: Route.ComponentProps) => {
  return <Chat/>;
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

export default ChatRoute;