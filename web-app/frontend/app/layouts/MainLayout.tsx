import type { Route } from "./+types/MainLayout";
import Footer from "~/components/common/Footer";
import { NavBar } from "~/components/common/NavBar";
import LoadingSpinner from "~/components/common/LoadingSpinner";

import { Outlet, redirect } from "react-router";
import { motion } from "framer-motion";
import { getValidAccessToken } from "~/utils/authService";

export const MainLayout = ({
    loaderData,
}: Route.ComponentProps) => {
    // We don't actually use the loaderData here, but we need
    // the client loader to run as it acts as a route guard.
    // The loader will redirect to the login page if the user is not authenticated.

export const MainLayout = () => {
     return (
          <motion.div className="flex flex-col min-h-screen bg-gray-900">
               <NavBar />
               <div className="flex-1 relative">
                   <Outlet />
               </div>
               <Footer />
           </motion.div>
       );
     }

export const clientLoader = async ({ 
    request
}: Route.ClientLoaderArgs) => {
    // Check if the user is authenticated by trying to get a valid access token
    const token = await getValidAccessToken();
    // If the token is not valid, redirect to the login page
    // and pass the intended URL as a query parameter
    // This will allow the login page to redirect back to the intended URL after successful login
    if (!token) {
        const url = new URL(request.url);
        const intended = url.pathname + url.search;
        throw redirect(`/login?redirectTo=${encodeURIComponent(intended)}`, {
            status: 302,
        });
    }
    // If the token is valid, return null to indicate that the loader has completed successfully
    // and the user can access the protected route.
    return null;
};

export const HydrateFallback = () => {
return (
    <div className="absolute inset-0 flex justify-center items-center">
        <LoadingSpinner text="MainLayout loading..." />
    </div>
);
}

export default MainLayout;