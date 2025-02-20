import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/LandingPage.tsx"),
  route("login", "routes/Login.tsx"),
  route("register", "routes/Registration.tsx"),
  route("dashboard", "routes/Dashboard.tsx"),
  route("exercises", "routes/Exercises.tsx"),
  route("workouts/:id", "routes/WorkoutDetails.tsx"),
  route("workouts/create", "routes/CreateWorkout.tsx"),
  route("workouts/create/exercises", "routes/ExerciseSelection.tsx"),
] satisfies RouteConfig;