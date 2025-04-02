import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import Sidebar from "~/components/Chat/ChatRoomsSidebar";
import ChatRoom from "~/components/Chat/ChatRoom";

export const Chat = () => {
    const navigate = useNavigate();
    const [selectedChatRoom, setSelectedChatRoom] = useState<number | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login"); 
        }
    }, [navigate]);

    return (
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
            
            
                {/* On click, fullscreen Chat Room */}
                {selectedChatRoom && (
                    <motion.button
                        onClick={() => navigate("/chat/" + selectedChatRoom)}
                        className="fixed top-16 right-6 bg-gray-700 text-white p-3 rounded-lg shadow-lg z-50 hover:bg-gray-600 flex items-center gap-2"
                        whileHover={{ scale: 1.1 }}
                    >
                        {/* Fullscreen icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4m-4 0l4 4M20 16v4m0 0h-4m4 0l-4-4M8 20H4m0 0v-4m0 4l4-4M16 4h4m0 0v4m0-4l-4 4" />
                        </svg>
                        Fullscreen
                    </motion.button>
                )}

            </motion.div>
        </motion.div>
    );
};