import { motion } from 'framer-motion';
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import Select from 'react-select';

type User = {
    id: number;
    username: string;
}

type ChatRoom = {
    id: number;
    name: string;
    participants: User[];
}

function Sidebar ({ onSelectChatRoom }: { onSelectChatRoom: (chatRoomId: number) => void }) {
    const navigate = useNavigate();
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [newChatRoomName, setNewChatRoomName] = useState<string>(""); 
    const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [resetDropDown, setResetDropDown] = useState(0); 

    const fetchChatRooms = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("Access token not found in localStorage");
            navigate("/login");
        }
        
        try {
            const chatRoomResponse = await fetch("http://127.0.0.1:8000/chat_rooms/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const chatRoom = await chatRoomResponse.json();
            setChatRooms(chatRoom);
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("Access token not found in localStorage");
            navigate("/login");
        }
    
        const fetchUsers = async () => {
            try {
                const userObjectsResponse = await fetch("http://127.0.0.1:8000/users/", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userObjects = await userObjectsResponse.json();
                console.log(userObjects);
                setUsers(userObjects);
    
                // Find the current user, for filtering out in the dropdown menu when choosing participants of chat room
                const current_user_id = localStorage.getItem("user_id");
                const current_user = userObjects.find((user: { id: number }) => user.id === Number(current_user_id));
                if (current_user) {
                    setCurrentUser(current_user);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchChatRooms();
        fetchUsers();
    }, [navigate]);

    const handleCreateChatRoom = async () => {
        if (newChatRoomName.trim() && selectedParticipants.length > 0) { // Check if chat room name and participants are provided
            setResetDropDown(resetDropDown + 1); // Reset the dropdown

            const participantIds = selectedParticipants.map(user => user.id);
            
            // Include the creator of the chat room
            if (currentUser && !participantIds.includes(currentUser.id)) {
                participantIds.push(currentUser.id);
            }

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
                // Reset form
                setNewChatRoomName(""); 
                setSelectedParticipants([]);

                fetchChatRooms(); 
            } else {
                console.error("Failed to create chat room");
            }
        } else {
            console.error("Chat room name and participants are required");
        }
    };

    const deleteChatRoom = async (chatRoomId: number) => {
        const response = await fetch(`http://127.0.0.1:8000/chat_room/delete/${chatRoomId}/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        if (response.ok) {
            fetchChatRooms();
        } else {
            console.error("Failed to delete chat room");
        }
    }

    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center text-white p-6 w-80 shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.h2
                className="text-2xl font-bold mb-4"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                Chat Rooms
            </motion.h2>

            {/* Chat Room List */}
            <motion.div
                className="flex flex-col w-full gap-2 overflow-y-auto max-h-64"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(75, 85, 99, 0.5) transparent'
                }}
            >
                {chatRooms.map((chatRoom) => (
                    <motion.div
                        key={chatRoom.id}
                        className="bg-gray-800 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-700 transition"
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className='font-medium'>{chatRoom.name}</span>

                        {/* Join Button */}
                        <motion.button
                            className="py-1 px-3 bg-blue-600 rounded hover:bg-blue-700 transition"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onSelectChatRoom(chatRoom.id)}
                        >
                            Join
                        </motion.button>

                        {/* Delete Button */}
                        <motion.button
                            className="py-1 px-3 bg-red-600 rounded hover:bg-red-700 transition"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteChatRoom(chatRoom.id)}
                        >
                            ✕
                        </motion.button>
                    </motion.div>
                ))}
            </motion.div>
            
            {/* Create New Chat Room */}
            <motion.div
                className="w-full bg-gray-800 p-4 mt-6 rounded-lg shadow-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <h3 className="text-lg font-bold mb-2">Create Chat Room</h3>
                <input
                    type="text"
                    value={newChatRoomName}
                    onChange={(e) => setNewChatRoomName(e.target.value)}
                    className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
                    placeholder="Chat Room Name"
                    required
                />

                {/* Dropdown for users */}
                <Select
                    key={resetDropDown} // Reset the selected users when chat room is created
                    isMulti
                    options={users
                        .filter(user => user.id !== currentUser?.id) // Exclude current user
                        .map(user => ({ value: user.id, label: user.username }))} // Convert to react-select format
                    className="mb-2"
                    onChange={(selectedOptions) => { // Convert back to User format
                        setSelectedParticipants(selectedOptions.map(option => ({ id: option.value, username: option.label }))); 
                    }}
                    styles={{ 
                        control: (provided) => ({ // The dropdown 
                            ...provided, backgroundColor: "#374151", color: "white", borderColor: "#4B5563"
                        }),
                        menu: (provided) => ({ // The dropdown menu
                            ...provided, backgroundColor: "#1F2937", color: "white"
                        }),
                        option: (provided, state) => ({ // The dropdown options
                            ...provided, backgroundColor: state.isFocused ? "#4B5563" : "#1F2937", color: "white"
                        }),
                        singleValue: (provided) => ({ // The selected value
                            ...provided, color: "white"
                        }),
                        multiValue: (provided) => ({ // The selected values
                            ...provided, backgroundColor: "#4B5563"
                        }),
                        multiValueLabel: (provided) => ({ // The selected values text
                            ...provided, color: "white"
                        }),
                        multiValueRemove: (provided) => ({ // The selected values remove button
                            ...provided, color: "white",
                            ":hover": { backgroundColor: "#DC2626", color: "white" }
                        })
                    }}
                />

                {/* Create Chat Room Button */}
                <motion.button
                    onClick={handleCreateChatRoom}
                    className="w-full py-2 bg-green-600 rounded hover:bg-green-700 transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Create Chat Room
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

export default Sidebar; 