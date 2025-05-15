import type { Route } from "./+types/RegistrationRoute";
import { RegistrationForm } from "../pages/Registration";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Registration" },
    { name: "description", content: "Create a new account" },
  ];
}

export default function Home() {
  return <RegistrationForm />;
}
