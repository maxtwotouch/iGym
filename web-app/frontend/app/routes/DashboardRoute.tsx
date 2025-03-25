import type { Route } from "./+types/DashboardRoute";
import { Dashboard } from "../pages/Dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Welcome to workoutapp!" },
  ];
}

export default function Home() {
  return <Dashboard />;
}
