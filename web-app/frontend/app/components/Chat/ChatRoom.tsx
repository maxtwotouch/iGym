import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import Select from 'react-select';
import apiClient from "~/utils/api/apiClient";
import { useAuth } from "~/context/AuthContext";

type ChatRoomProps = {
    chatRoomId: number;
    onLeave: () => void;
};

type User = {
    id: number;
    username: string;
};

type Workout = {
    id: number;
    name: string;
};

type ChatWorkout = {
    type: "workout";
    id: number;
    owners: number[];
    name: string;
    sender: string;
    date_sent: string;
};

type Message = {
    type: "message" | "confirmation" | "leave";
    content: string;
    sender: string;
    date_sent: string;
};

type Notification = {
    id: number;
    sender: number;
    chat_room_id: number;
    chat_room_name: string;
    date_sent: Date;
    message: string | null;
    workout_message: string | null;
};

const ChatRoom: React.FC<ChatRoomProps> = ({ chatRoomId, onLeave }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [roomName, setRoomName] = useState<string>("");
    const socketRef = useRef<WebSocket | null>(null);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout>();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [chatWorkouts, setChatWorkouts] = useState<ChatWorkout[]>([]);
    const [isWorkoutsVisible, setIsWorkoutsVisible] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchChat = async () => {
            try {
                const currentChatResponse = await apiClient.get(`/chat/${chatRoomId}/`);

                if (currentChatResponse.status !== 200) {
                    throw `Failed to fetch chat room. Status: ${currentChatResponse.status}`;
                }

                const currentChat = currentChatResponse.data;
                setRoomName(currentChat.name);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        }

        const fetchParticipants = async () => {
            try {
                const participantsResponse = await apiClient.get(`/chat/${chatRoomId}/participants/`);

                if (participantsResponse.status !== 200) {
                    throw `Failed to fetch participants. Status: ${participantsResponse.status}`;
                }

                const participants = participantsResponse.data;
                setUsers(participants);
            
            } catch (error) {
                console.error("Error fetching participants:", error);
            }
        }

        const fetchUserWorkouts = async () => {
            try {
                const userWorkoutsResponse = await apiClient.get(`/workout/`);

                if (userWorkoutsResponse.status !== 200) {
                    throw `Failed to fetch workouts. Status: ${userWorkoutsResponse.status}`;
                }

                const userWorkouts = await userWorkoutsResponse.data;

                setWorkouts(userWorkouts.map((workout: { 
                        id: number; 
                        name: string 
                    }) => ({ 
                        id: workout.id, 
                        name: workout.name 
                    }))
                );
            } catch (error) {
                console.error("Error fetching workouts:", error);
            }
        }

        const fetchMessages = async () => {
            try {
                const messagesResponse = await apiClient.get(`/chat/${chatRoomId}/messages/`);

                if (messagesResponse.status !== 200) {
                    throw `Failed to fetch messages. Status: ${messagesResponse.status}`;
                }

                const messages = await messagesResponse.data;

                setMessages(messages.map((
                    message: { 
                        type: "message"; 
                        content: string; 
                        sender: number; 
                        date_sent: string 
                    }) => ({ 
                        type: "message", 
                        content: message.content, 
                        sender: message.sender, 
                        date_sent: message.date_sent 
                    }))
                );
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        }

        const fetchWorkoutMessages = async () => {
            try {
                const workoutMessagesResponse = await apiClient.get(`/chat/${chatRoomId}/workout_messages/`);

                if (workoutMessagesResponse.status !== 200) {
                    throw `Failed to fetch workout messages. Status: ${workoutMessagesResponse.status}`;
                }

                const workoutMessages = await workoutMessagesResponse.data;

                setChatWorkouts(
                    workoutMessages.map((workoutMessage:{
                        id: number; 
                        sender: number; 
                        date_sent: string; 
                        workout: { 
                            id: number; 
                            owners: number[]; 
                            name: string; 
                        } 
                    }) => ({
                        type: "workout",
                        id: workoutMessage.workout.id,
                        owners: workoutMessage.workout.owners,
                        name: workoutMessage.workout.name,
                        sender: workoutMessage.sender,
                        date_sent: workoutMessage.date_sent,
                    }))
                );
            } catch (error) {
                console.error("Error fetching workout messages:", error);
            }
        }

        const notificationsList = async () => {
            try {
                const notificationsUserResponse = await apiClient.get(`/notification/`);

                if (notificationsUserResponse.status !== 200) {
                    throw `Failed to fetch notifications. Status: ${notificationsUserResponse.status}`;
                }

                const notificationsUserData = await notificationsUserResponse.data;

                notificationsUserData.map((notification: any) => {
                    setNotifications((prev) => [...prev, {
                        id: notification.id,
                        sender: notification.sender,
                        chat_room_id: notification.chat_room_id,
                        chat_room_name: notification.chat_room_name,
                        date_sent: new Date(notification.date_sent),
                        message: notification.message || null,
                        workout_message: notification.workout_message?.name || null,
                    }]);
                });
                console.log("Fetched notifications:", notificationsUserData);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        }
        
        fetchChat();
        fetchParticipants();
        fetchMessages();
        fetchWorkoutMessages();
        fetchUserWorkouts();
        notificationsList();
    }, [chatRoomId]); 

    // Connect to the WebSocket, listen for new messages, and close the connection when the user leaves the chat room
    useEffect(() => {
        let isComponentMounted = true;  // Flag to track if component is still mounted

        const handleSocket = async () => {
            // Clean up any existing socket
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }

            try {
                const socket = await apiClient.createSocket(chatRoomId);
                
                // Don't set up the socket if component was unmounted
                if (!isComponentMounted) {
                    socket.close();
                    return;
                }

                socketRef.current = socket;

                socket.onmessage = (event) => {
                    const message = JSON.parse(event.data);

                    if (message.type === "notification") { // No notification list inside the chat room
                        console.log("Received notification:", message);
                        return;
                    }

                    else if (message.type === "message") { // Handle normal text messages
                        const newMessage: Message = { 
                            type: "message", 
                            content: String(message.content), 
                            sender: String(message.sender), 
                            date_sent: message.date_sent || new Date().toISOString() 
                        };

                        setMessages((prevMessages) => [...prevMessages, newMessage]);
                    } 
                    else if (message.type === "workout") { // Handle workout messages
                        const newWorkoutMessage: ChatWorkout = {
                            type: "workout",
                            id: message.workout.id,
                            owners: message.workout.owners,
                            name: message.workout.name,
                            sender: String(message.sender),
                            date_sent: message.workout.date_sent ? message.workout.date_sent : new Date().toISOString(),
                        };
                        setChatWorkouts((prevWorkouts) => [...prevWorkouts, newWorkoutMessage]);
                    } 
                    else if (message.type === "confirmation") { // Handle workout confirmation messages (confirming added workout)
                        const userName = message.added_to_workout;
                        const workoutName = message.workout.name;

                        const confirmationMessage: Message = {
                            type: "confirmation",
                            content: `${userName} has accepted the workout: ${workoutName}`,
                            sender: `${userName}`,
                            date_sent: new Date().toISOString(),
                        };
                        
                        setMessages((prevMessages) => [...prevMessages, confirmationMessage]);
                    }

                    else if (message.type === "leave") { // Handle leave messages (people leaving the chat room)
                        const username = message.left_the_group_chat;

                        const leaveMessage: Message = {
                            type: "leave",
                            content: `${username} has left the chat room`,
                            sender: `${username}`,
                            date_sent: new Date().toISOString(),
                        };

                            setMessages((prevMessages) => [...prevMessages, leaveMessage]);
                    }
                }
            } catch (error) {
                console.error("Socket connection error:", error);
            }
        };

        handleSocket();

        // Cleanup function that runs when component unmounts or when effect re-runs
        return () => {
            isComponentMounted = false;  // Mark component as unmounted
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [chatRoomId]);

    useEffect(() => {
        const deleteNotificationsChat = async () => {
            try {
                // Deleting every notification from the chat room for the current user
                notifications.forEach(async (notification) => {
                    if (notification.chat_room_id === chatRoomId) {
                        await apiClient.delete(`/notification/delete/${notification.id}/`);
                    }
                });
            } catch (error) {
                console.error("Error deleting notifications:", error);
            }
        }

        deleteNotificationsChat();
    }, [notifications, navigate]);

    const sendMessage = () => {
        if (!newMessage.trim()) return; // Don't send empty messages
        if (!socketRef.current) return; // Not allow for sending messages if the socket is not connected

        try {
            socketRef.current.send(JSON.stringify({  
                type: "message",
                message: newMessage, 
            }));
        } catch (error) {
            console.error("Error sending message:", error);
        }

        setNewMessage("");
    };

    const sendWorkout = () => {
        if (!socketRef.current) return; // Not allow for sending messages if the socket is not connected
        if (!selectedWorkout) return; // Don't send empty workout

        socketRef.current.send(JSON.stringify({
            type: "workout",
            workout: selectedWorkout,
        }));
    }

    const acceptWorkout = async (workout: ChatWorkout) => {
        if (!socketRef.current) return; // Not allow for sending messages if the socket is not connected

        if (workout.owners.includes(Number(user?.userId))) {
            alert("You already own this workout!");
            return;
        }
        
        socketRef.current.send(JSON.stringify({
            type: "confirmation",
            workout_id: workout.id,
            user_id: user?.userId,
            message: `${user?.username} has accepted the workout: ${workout.name}`
        }));
    }

    const leaveChatRoom = async (chatRoomId: number) => {    
        if (user?.userType === "user") {
            if (user?.profile.pt_chatroom === chatRoomId) {
                alert("Cannot leave the chat room with your personal trainer!");
                return;
            }
        }
        // Find the other participant (the client) and check if the client have this chat room as their pt_chat room, if so, stop the leave
        else if (user?.userType === "trainer") {
            const client = users.find(x => x.id !== user.userId);
    
            if (!client) {
                console.log("Client has already left the chat room");
            } else {
                try {
                    const response = await apiClient.get(`/user/${client.id}/`);

                    if (response.status !== 200) {
                        throw new Error(`Failed to fetch client data. Status: ${response.status}`);
                    }
    
                    const clientData = await response.data;
    
                    if (clientData.profile.pt_chatroom === chatRoomId) {
                        alert("Cannot leave: the client still has this chat room as their PT chat.");
                        return;
                    }
    
                } catch (err: any) {
                    console.error("Error fetching client data:", err);
                }
            }
        }
    
        if (!socketRef.current) return;
    
        socketRef.current.send(JSON.stringify({
            type: "leave",
            user_id: user?.userId,
            message: `${user?.username} has left the chat room`
        }));
    
        const response = await apiClient.delete(`/chat/delete/${chatRoomId}/`);

        if (response.status !== 204) {
            throw `Failed to delete chat room. Status: ${response.status}`;
        }

        onLeave();
    };

    const getUsernameById = (userId: number) => {
        const user = users.find(user => user.id === userId);
        return user ? user.username : "";
    };

    const sortedMessages = [...messages, ...chatWorkouts].sort(
        (a, b) => new Date(a.date_sent).getTime() - new Date(b.date_sent).getTime()
    );

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


            {/* Messages in Chat Room*/}
            <motion.div className="bg-gray-800 p-4 rounded-lg shadow-md w-full max-w-2xl flex flex-col h-[60vh]">
                <motion.div className="flex-1 overflow-y-scroll p-4 space-y-4">
                    {sortedMessages.map((message, index) => {
                        let sender;
                        let isOwnMessage;
                        
                        // Differentiate between system messages and user messages
                        if (message.type === "confirmation") { // Accepted workout messages
                            sender = "System";
                            isOwnMessage = false;
                        }
                        if (message.type === "leave") { // Accepted workout messages
                            sender = "System";
                            isOwnMessage = false;
                        }
                        else { // Normal messages and workout messages
                            const message_sender_id = Number(message.sender);
                            sender = getUsernameById(message_sender_id);
                            isOwnMessage = sender === user?.username;
                        }
                            
                        // Display text messages
                        if (message.type === "message") {
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
                        }
                        
                        // Display confirmation messages
                        else if (message.type === "confirmation") {
                            return (
                                <motion.div
                                    key={index}
                                    className="flex justify-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                    <div className="p-3 rounded-lg max-w-xs bg-green-500 text-white">
                                        <p className="text-sm">{message.content}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {sender}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        }

                        // Display leave messages
                        else if (message.type === "leave") {
                            return (
                                <motion.div
                                    key={index}
                                    className="flex justify-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                    <div className="p-3 rounded-lg max-w-xs bg-red-500 text-white">
                                        <p className="text-sm italic">{message.content}</p>
                                        <p className="text-xs text-gray-300 mt-1">{sender}</p>
                                    </div>
                                </motion.div>
                            );
                        }

                        // Display workout messages
                        else if (message.type == "workout") {
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
                                        <p className="text-sm">(Shared by {sender})</p>
                                        <p className="text-sm font-bold">🏋️📋 {message.name}</p>

                                        {/* Button for Accepting Workout */}
                                        <motion.button
                                            onClick={() => {acceptWorkout(message)}}
                                            className="mt-2 p-2 bg-blue-500 rounded hover:bg-blue-600 transition"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            Accept Workout
                                        </motion.button>
                                    </div>
                                    
                                </motion.div>
                            );

                        }
                    })}
                </motion.div>
            </motion.div>
            
            {/* Send Workout */}
            <motion.div className="flex p-2 bg-gray-700 rounded-b-lg">
                <motion.div className="relative flex flex-col items-center">
                    {/* Biceps button to toggle dropdown */}
                    <motion.button
                        onClick={() => setIsWorkoutsVisible(!isWorkoutsVisible)}
                        name="workoutButton"
                        className="text-4xl cursor-pointer"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        💪
                    </motion.button>
                    
                    {/* Dropdown and Button (hidden until icon clicked) */}
                    {isWorkoutsVisible && (
                        <motion.div
                            className="mt-2 flex flex-col items-center bg-gray-700 p-3 rounded-lg shadow-lg"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {/* Dropdown Menu Workout */}
                            <Select
                                options={workouts.map(workout => ({
                                    value: workout.id,
                                    label: workout.name
                                }))}
                                className="mb-2"
                                onChange={(selectedOption) => {
                                    setSelectedWorkout(selectedOption
                                        ? { id: selectedOption.value, name: selectedOption.label }
                                        : undefined);
                                }}
                                styles={{
                                    control: (provided) => ({  // Styles for the dropdown
                                        ...provided,
                                        backgroundColor: "#374151",
                                        color: "white",
                                        borderColor: "#4B5563"
                                    }),
                                    menu: (provided) => ({ // Styles for the dropdown menu
                                        ...provided,
                                        backgroundColor: "#1F2937",
                                        color: "white"
                                    }),
                                    option: (provided, state) => ({ // Styles for the dropdown options
                                        ...provided,
                                        backgroundColor: state.isFocused ? "#4B5563" : "#1F2937",
                                        color: "white"
                                    }),
                                    singleValue: (provided) => ({ // Styles for the selected value
                                        ...provided,
                                        color: "white"
                                    })
                                }}
                            />

                            {/* Send Workout Button */}
                            <motion.button
                                onClick={sendWorkout}
                                className="p-2 bg-blue-500 rounded hover:bg-blue-600 transition"
                                whileHover={{ scale: 1.05 }}
                            >
                                Send Workout
                            </motion.button>
                        </motion.div>
                    )}
                </motion.div>

                {/* Input field New Message */}
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

                {/* Send Message Button */}
                <motion.button
                    onClick={sendMessage}
                    className="ml-2 p-2 bg-blue-500 rounded hover:bg-blue-600 transition"
                    whileHover={{ scale: 1.05 }}
                >
                    Send
                </motion.button>
                
                {/* Leave Button */}
                <motion.button
                    className="py-1 px-3 bg-red-600 rounded hover:bg-red-700 transition"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => leaveChatRoom(chatRoomId)}
                >
                    Leave
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

export default ChatRoom;