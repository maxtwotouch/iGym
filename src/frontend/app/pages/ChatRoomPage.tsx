import React from 'react';
import ChatRoom from '~/components/Chat/ChatRoom';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';


const ChatRoomPage: React.FC = () => {
    const { id } = useParams();
    const chatRoomId = Number(id)
    const navigate = useNavigate();
   
   // State to manage chat room ID
   const [currentChatRoomId, setCurrentChatRoomId] = useState<number | null>(chatRoomId);

   const handleLeaveChatRoom = () => {
       setCurrentChatRoomId(null); 
       navigate("/chat"); 
   };

   useEffect(() => {
       // Effect to update the state based on params
       setCurrentChatRoomId(chatRoomId);
   }, [chatRoomId]);

    // Chat room in fullscreen, exit
    return (
        <motion.div
            className="min-h-screen bg-900 flex flex-col text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
                <ChatRoom chatRoomId={chatRoomId}  onLeave={handleLeaveChatRoom} />

                {/* Exit Chat Room button */}
                <motion.button
                    onClick={() => navigate("/chat")} 
                    className="fixed top-26 right-8 bg-gray-700 text-white p-3 rounded-lg shadow-lg z-50 hover:bg-gray-600 flex items-center gap-2 cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                >
                    {/* Exit Chat Room icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 4h4m0 0v4m0-4l-4 4M8 20H4m0 0v-4m0 4l4-4" />
                    </svg>
                    Exit Chat Room
                </motion.button>
        </motion.div>
    );
};

export default ChatRoomPage;