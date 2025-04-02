import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    index("routes/LandingPageRoute.tsx"),

    layout("./layouts/AuthLayout.tsx", [
        route("login", "routes/LoginRoute.tsx"),
        route("register", "routes/RegistrationRoute.tsx"),
    ]),

    layout("./layouts/MainLayout.tsx", [
        route("dashboard", "routes/DashboardRoute.tsx"),
        route("about", "routes/AboutRoute.tsx"),
        route("calendar", "routes/CalendarRoute.tsx"),
        route("chat", "routes/ChatRoute.tsx"),
        route("workouts/create", "routes/CreateWorkoutRoute.tsx"),
        route("workouts/create/exercises", "routes/ExerciseSelectionRoute.tsx"),
        route("workouts/update/:id", "routes/EditWorkoutRoute.tsx"),
        route(":id/workout/session/create", "routes/WorkoutSessionRoute.tsx"),
        route("exercises", "routes/ExercisesRoute.tsx"),
        route("exercises/:id", "routes/ExerciseDetailRoute.tsx"),
        route("profile", "routes/ProfileRoute.tsx"),
        route("personalTrainers", "routes/SelectPTRoute.tsx"),
    ]),
] satisfies RouteConfig;
