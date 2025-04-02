import type { Route } from "./+types/LoginRoute";
import { LoginForm } from "../pages/Login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login" },
    { name: "description", content: "Login to your user" },
  ];
}

export default function Home() {
  return <LoginForm />;
}
