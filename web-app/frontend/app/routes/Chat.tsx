import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "~/components/NavBar";
import Sidebar from "~/components/ChatRoomsSideBar";
import ChatRoom from "~/components/ChatRoom";
import Footer from "~/components/Footer";
import 'bootstrap/dist/css/bootstrap.css'

const Chat = () => {
    const navigate = useNavigate();
    const [selectedChatRoom, setSelectedChatRoom] = useState<number | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login"); 
        }
    }, [navigate]);

    return (
        <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col text-white">
            <NavBar />
            <motion.div
                className="flex flex-grow p-6 flex-col md:flex-row gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >

                {/* Sidebar to the left */}
                <motion.div
                    className="md:w-1/4 w-full bg-gray-800 p-4 rounded-lg shadow-md"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Sidebar onSelectChatRoom={setSelectedChatRoom} />
                </motion.div>

                {/* Chat Room to the right */}
                <motion.div
                    className="d:w-3/4 w-full bg-gray-800 p-6 rounded-lg shadow-md flex flex-col"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {selectedChatRoom ? (
                        <>
                            <ChatRoom chatRoomId={selectedChatRoom} />
                        </>
                    ) : (
                        <>
                            <p className="text-gray-400 text-center">Select a chat room to start chatting</p>
                        </>
                    )}
                </motion.div>
            </motion.div>
            <Footer />
        </motion.div>
    );
};

export default Chat;
