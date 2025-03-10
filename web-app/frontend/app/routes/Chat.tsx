import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";
import Sidebar from "~/components/ChatRoomsSideBar";
import Footer from "~/components/Footer";
import 'bootstrap/dist/css/bootstrap.css'

interface User {
    id: number;
    username: string;
}

const Chat: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login"); // Redirect to login if no token is found
        }
    }, [navigate]);

    return (
        <motion.div className="d-flex flex-column min-vh-100">
            <NavBar />

            <motion.div
                className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-xl font-bold text-white">Chat</h2>

                <Sidebar />

            </motion.div>
            <Footer />
        </motion.div>
    );
};

export default Chat;
