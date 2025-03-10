import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/LandingPage.tsx"),
  route("login", "routes/Login.tsx"),
  route("register", "routes/Registration.tsx"),
  route("dashboard", "routes/Dashboard.tsx"),
  route("exercises", "routes/Exercises.tsx"),
  route("workouts/create", "routes/CreateWorkout.tsx"),
  route("workouts/create/exercises", "routes/ExerciseSelection.tsx"),
  route("workouts/update/:id", "routes/EditWorkout.tsx"),
  route("exercises/:id", "routes/ExerciseDetail.tsx"),
  route("about", "routes/About.tsx"),
  route("calendar", "routes/Calendar.tsx"),
  route(":id/workout/session/create", "routes/WorkoutSession.tsx"),
] satisfies RouteConfig;

