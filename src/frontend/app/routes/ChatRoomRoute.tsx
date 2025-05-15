import type { Route } from "./+types/ChatRoomRoute";
import ChatRoomPage from "~/pages/ChatRoomPage";
import LoadingSpinner from "~/components/common/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chat Room Fullscreen" },
    { name: "description", content: "Chat room in fullscreen mode" },
  ];
}

const ChatRoomRoute = ({
    loaderData,
  }: Route.ComponentProps) => {
    return <ChatRoomPage/>;
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
      <LoadingSpinner text="Loading Chat Room..." />
    </div>
  );
}

export default ChatRoomRoute; 