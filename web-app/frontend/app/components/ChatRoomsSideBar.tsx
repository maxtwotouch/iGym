import { motion } from 'framer-motion';
import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";

interface User {
    id: number;
    username: string;
}

interface ChatRoom {
    id: number;
    name: string;
    participants: User[];
}

function Sidebar () {
    const navigate = useNavigate();
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [newChatRoomName, setNewChatRoomName] = useState<string>(""); 
    const [participants, setParticipants] = useState<string>("");
    const [users, setUsers] = useState<User[]>([]);

    // Fetch chat rooms function
    const fetchChatRooms = async () => {
        const token = localStorage.getItem("accessToken"); // Retrieve JWT token
        try {
            const response = await fetch("http://127.0.0.1:8000/chat_rooms/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                console.error("Failed to fetch chat rooms");
                return;
            }
            const data = await response.json();
            setChatRooms(data);
            console.log("Fetched Chat Rooms:", data);
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
        }
    };

    // Fetch users function
    const fetchUsers = async () => {
        const token = localStorage.getItem("accessToken"); // Retrieve JWT token
        try {
            const response = await fetch("http://127.0.0.1:8000/users/", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                console.error("Failed to fetch users");
                return;
            }
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchChatRooms();
    }, [navigate]);

    const handleCreateChatRoom = async () => {
        if (newChatRoomName.trim() && participants.trim()) {
            const usernames = participants.split(',').map(username => username.trim());
            
            // Include the username of the creator of the chat room
            const current_user_username = localStorage.getItem("username");
            
            if(!current_user_username) {
                console.error("Failed to get the current user's username");
                return;
            
            }
            usernames.push(current_user_username)

            
            const participantIds = users
                .filter(user => usernames.includes(user.username))
                .map(user => user.id);

            const response = await fetch("http://127.0.0.1:8000/chat_room/create/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
                },
                body: JSON.stringify({
                    name: newChatRoomName,
                    participants: participantIds
                })
            });

            if (response.ok) {
                setNewChatRoomName("");
                setParticipants("");
                await fetchChatRooms(); 
            } else {
                console.error("Failed to create chat room");
            }
        } else {
            console.error("Chat room name and participants are required");
        }
    };

    return (
        <div className="sidebar">
            <h2>Chat Rooms</h2>
            <div className="chat-room-list">
                {chatRooms.map((chatRoom) => (
                    <div className="chat-room-item" key={chatRoom.id}>{chatRoom.name}</div>
                ))}
            </div>
            <div className="create-chat-room">
                <input
                    type="text"
                    value={newChatRoomName}
                    onChange={(e) => setNewChatRoomName(e.target.value)}
                    className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
                    placeholder="Chat Room Name"
                    required
                />
                <input
                    type="text"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
                    placeholder="Participants (comma-separated usernames)"
                    required
                />
                <button onClick={handleCreateChatRoom}>Create Chat Room</button> {/* Fixed the button */}
            </div>
        </div>
    );
};

export default Sidebar; 
