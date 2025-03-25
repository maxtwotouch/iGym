import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";

type User = {
    id: number;
    username: string;
};

const NavBar = () => {
    const [clients, setClients] = useState<User []>([]);
    const [trainer, setTrainer] = useState<User | null>(null);
    const [userType, setUserType] = useState<string | null>(null);
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    useEffect(() => {
        const storedUserType = localStorage.getItem('userType');
        if (storedUserType) {
            setUserType(storedUserType);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert("Access token not found in localStorage");
            window.location.href = '/login';
        }
    
        const fetchTrainerOrClients = async () => {
            try {
                if (userType === 'user') {
                    const userResponse = await fetch(`http://127.0.0.1:8000/user/${localStorage.getItem("user_id")}/`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const userData = await userResponse.json();

                    // Translate from profile id to user id
                    const trainersResponse = await fetch(`http://127.0.0.1:8000/personal_trainers/`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const trainerData = await trainersResponse.json();

                    trainerData.find((trainer: any) => { 
                        if (trainer.trainer_profile.id === userData.user_profile.personal_trainer) {
                            setTrainer({ id: trainer.id, username: trainer.username });
                        }
                    });
                } 
                else if (userType === 'trainer') {
                    const clientsArrayResponse = await fetch(`http://127.0.0.1:8000/personal_trainer/clients/`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const clientsArrayData = await clientsArrayResponse.json();

                    clientsArrayData.map((client: any) => {
                        setClients((prevClients) => [...prevClients, { id: client.id, username: client.username }]);
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
         
        fetchTrainerOrClients();
    }, [userType]); 

    return (
        <motion.nav
            className="bg-gradient-to-br from-gray-900 to-gray-800 py-4 shadow-md text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
        >
            <div className="container mx-auto flex items-center space-x-6">

                {/* Logo */}
                <motion.div
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link className="text-2xl font-bold" to="/dashboard">iGym</Link>
                </motion.div>

                {/* Navigation Links */}
                <motion.div
                    className="flex space-x-4 items-center"
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link className={`hover:text-blue-400 ${location.pathname === '/dashboard' && 'text-blue-400'}`} to="/dashboard">Home</Link>
                    <Link className={`hover:text-blue-400 ${location.pathname === '/exercises' && 'text-blue-400'}`} to="/exercises">Exercises</Link>
                    <Link className={`hover:text-blue-400 ${location.pathname === '/calendar' && 'text-blue-400'}`} to="/calendar">Calendar</Link>
                    <Link className={`hover:text-blue-400 ${location.pathname === '/chat' && 'text-blue-400'}`} to="/chat">Chat</Link>
                    
                    {/* Selecting PT only for User */}
                    {userType === "user" && (
                    <Link className={`hover:text-blue-400 ${location.pathname === '/personalTrainers' && 'text-blue-400'}`} to="/personalTrainers">
                        Personal Trainers
                    </Link>
                    )}

                    {/* Showing my PT for user */}
                    {userType === "user" && trainer && (
                    <Link
                        to={`/personal_trainer/${trainer.id}/`}
                        className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 transition flex items-center"
                    >
                        {trainer.username} 💪
                    </Link>
                    )}

                    {/* Dropdown for PT, shows a list of his clients */}
                    {userType === "trainer" && (
                        <div className="relative group">
                            <button className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 transition">
                                My Clients
                            </button>   
                            <motion.ul
                                className="absolute left-0 top-full bg-gray-800 py-2 rounded shadow-lg hidden group-hover:block z-10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                            {clients.length ? (
                                clients.map((client) => (
                                    <li key={client.id}>
                                        <Link
                                            className="block px-4 py-1 hover:bg-gray-700 transition"
                                            to={`/user/${client.id}`}
                                        >
                                            {client.username}
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-1 text-gray-400">No clients</li>
                            )}
                            </motion.ul>
                        </div>
                    )}
                </motion.div>

                {/* Logout Button */}
                <div className="flex-1 flex justify-end">
                    <motion.button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 rounded px-4 py-1 transition"
                        whileHover={{ scale: 1.05 }}
                    >
                        Logout
                    </motion.button>
                </div>
            </div>
        </motion.nav>
    );
}

export default NavBar;