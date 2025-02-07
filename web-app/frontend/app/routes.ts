import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/LandingPage.tsx"),
  route("login", "routes/Login.tsx"),
  route("registration", "routes/Registration.tsx"),
  route("dashboard", "routes/Dashboard.tsx"),
] satisfies RouteConfig;