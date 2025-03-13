import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type ChatRoomProps = {
    chatRoomId: number;
};

type Message = {
    content: string;
    sender: string;
};

type User = {
    id: number;
    username: string;
};

const ChatRoom: React.FC<ChatRoomProps> = ({ chatRoomId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [roomName, setRoomName] = useState<string>("");
    const socketRef = useRef<WebSocket | null>(null);
    const navigate = useNavigate();

    const token = localStorage.getItem("accessToken");
    if (!token) {
        navigate("/login"); 
        return;
    }

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/chat_room/messages/${chatRoomId}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    console.error("Failed to fetch messages");
                    return;
                }
                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/chat_room/${chatRoomId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) {
                    console.error("Failed to fetch users");
                    return;
                }
                const data = await response.json();
                setUsers(data.participants.map((user: { id: number; username: string }) => ({ id: user.id, username: user.username })));
                setRoomName(data.name);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        }

        fetchMessages();
        fetchUsers();
    }, [chatRoomId]);

    useEffect(() => {
        if (!chatRoomId) return;

        if (socketRef.current) {
            socketRef.current.close();
        }

        const socket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${chatRoomId}/?token=${token}`);
        socketRef.current = socket;

        socketRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, message]); 
        };

        return () => {
            if (socketRef.current) {socketRef.current.close();}
        }
    }, [chatRoomId]);

    const sendMessage = () => {
        if (!newMessage.trim()) return;
        if (!socketRef.current) return;

        socketRef.current.send(JSON.stringify({ 
            message: newMessage, 
        }));
        setNewMessage("");
    };

    const getUsernameById = (userId: number) => {
        const user = users.find(user => user.id === userId);
        return user ? user.username : "Unknown";
    };
    
    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            <motion.h1
                className="text-2xl font-bold mb-4"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {roomName} 
            </motion.h1>

            {/* Messages */}
            <motion.div className="bg-gray-800 p-4 rounded-lg shadow-md w-full max-w-2xl flex flex-col h-[60vh]">
                <motion.div className="flex-1 overflow-y-scroll p-4 space-y-4">
                    {messages.map((message, index) => {
                        const message_sender_id = Number(message.sender);
                        const sender = getUsernameById(message_sender_id);
                        const isOwnMessage = sender === localStorage.getItem("username");
                        
                        return (
                            <motion.div
                                key={index}
                                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                                <div
                                className={`p-3 rounded-lg max-w-xs ${
                                    isOwnMessage
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-700 text-gray-200"
                                }`}
                                >
                                <p className="text-sm">{message.content}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {isOwnMessage ? "You" : sender}
                                </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </motion.div>
            
            <motion.div className="flex p-2 bg-gray-700 rounded-b-lg">
                {/* Input field */}
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault(); 
                            sendMessage();
                        }
                    }}
                    className="flex-1 p-2 rounded bg-gray-600 text-white"
                    placeholder="Type a message..."
                />
                {/* Send button */}
                <motion.button
                    onClick={sendMessage}
                    className="ml-2 p-2 bg-blue-500 rounded hover:bg-blue-600 transition"
                    whileHover={{ scale: 1.05 }}
                >
                    Send
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

export default ChatRoom;