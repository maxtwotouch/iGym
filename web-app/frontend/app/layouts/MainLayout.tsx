import Footer from "~/components/common/Footer";
import { NavBar } from "~/components/common/NavBar";

import { Outlet } from "react-router";
import { motion } from "framer-motion";

export const MainLayout = () => {
    return (
        <motion.div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex-1 relative">
                <Outlet />
            </div>
            <Footer />
        </motion.div>
    );
}

export default MainLayout;