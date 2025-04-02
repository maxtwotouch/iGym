import type { Route } from "./+types/AboutRoute";
import { About } from "../pages/About";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About" },
    { name: "description", content: "About our website!" },
  ];
}

export default function Home() {
  return <About />;
}