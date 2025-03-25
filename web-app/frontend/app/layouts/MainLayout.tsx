import Footer from "~/components/common/Footer";
import NavBar from "~/components/common/Navbar";

import { Outlet } from "react-router";
import { motion } from "framer-motion";

export const MainLayout = () => {
    return (
        <motion.div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex-grow">
            <Outlet />
            </div>
            <Footer />
        </motion.div>
    );
}

export default MainLayout;