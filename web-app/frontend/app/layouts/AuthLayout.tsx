import { motion } from "framer-motion";
import { Outlet, useLocation } from "react-router";

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export const AuthLayout = () => {
    // Get the current route
    const currentRoute = useLocation().pathname;
    // Check if the current route is "/login" or "/register"
    const isLoginPage = currentRoute === "/login";
    const isRegisterPage = currentRoute === "/register";

    // Set text content based on the current route
    const title = isLoginPage ? "Login to iGym" : (isRegisterPage ? "Register for iGym" : "null");
    const bottomText = isLoginPage ? "Don't have an account?" : (isRegisterPage ? "Already have an account?" : "null");
    const linkText = isLoginPage ? "Register here" : (isRegisterPage ? "Login here" : "null");
    const linkUrl = isLoginPage ? "/register" : (isRegisterPage ? "/login" : "null");

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white"
      initial={{ opacity: 1}}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
        <motion.h1
            className="text-4xl font-bold mb-6"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {title}
        </motion.h1>
        
        <Outlet />

        <motion.p
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
        >
            {bottomText}{" "}
            <a className="text-blue-500 hover:underline" href={linkUrl}>
                {linkText}
            </a>
        </motion.p>
    </motion.div>
  );
}


export default AuthLayout;