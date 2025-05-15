import type { Route } from "./+types/LandingPageRoute";
import { LandingPage } from "../pages/LandingPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LandingPage" },
    { name: "description", content: "Welcome to iGym! Start by logging in or register an account" },
  ];
}

export default function Home() {
  return <LandingPage />;
}