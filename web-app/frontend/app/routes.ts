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
    ]),
    
] satisfies RouteConfig;
