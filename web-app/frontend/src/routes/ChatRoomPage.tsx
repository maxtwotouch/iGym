import React from 'react';
 import NavBar from "../components/NavBar";
 import Footer from '../components/Footer';
 import ChatRoom from '../components/ChatRoom';
 import { motion } from 'framer-motion';
 import { useParams } from 'react-router-dom';
 import { useNavigate } from 'react-router-dom';
 
 const ChatRoomPage: React.FC = () => {
     const { id } = useParams();
     const chatRoomId = Number(id)
     const navigate = useNavigate();
 
     return (
         <motion.div
             className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col text-white"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5 }}
         >
             <NavBar />
                 <ChatRoom chatRoomId={chatRoomId} />
 
                 {/* Exit Chat Room button */}
                 <motion.button
                     onClick={() => navigate("/chat")} 
                     className="fixed top-16 right-6 bg-gray-700 text-white p-3 rounded-lg shadow-lg z-50 hover:bg-gray-600 flex items-center gap-2"
                     whileHover={{ scale: 1.1 }}
                 >
                     {/* Exit Chat Room icon */}
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M16 4h4m0 0v4m0-4l-4 4M8 20H4m0 0v-4m0 4l4-4" />
                     </svg>
                     Exit Chat Room
                 </motion.button>
             <Footer />
         </motion.div>
     );
 };
 
 export default ChatRoomPage;