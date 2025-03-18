import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

type User = {
    id: number;
    username: string;
};

function NavBar() {
    const [clients, setClients] = useState<User []>([]);
    const [trainer, setTrainer] = useState<User | null>(null);
    const [userType, setUserType] = useState<string | null>(null);
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        localStorage.removeItem('user_id');
        localStorage.removeItem('userType');
        window.location.href = '/login';
    };

    useEffect(() => {
        const storedUserType = localStorage.getItem('userType');
        if (storedUserType) {
            console.log("Setting user type:", storedUserType);
            setUserType(storedUserType);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            window.location.href = '/login';
        }
    
        const fetchData = async () => {
            try {
                if (userType === 'user') {
                    const response = await fetch(`http://127.0.0.1:8000/user/${localStorage.getItem("user_id")}/`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await response.json();
                    console.log("Fetched user:", data);
                    setTrainer(data.user_profile.personal_trainer);
                    console.log("Fetched trainer:", data.user_profile.personal_trainer);
                } 
                else if (userType === 'trainer') {
                    const response = await fetch(`http://127.0.0.1:8000/personal_trainer/${localStorage.getItem("user_id")}/`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    console.log("Fetching trainer data");
                    const data = await response.json();
                    console.log("Fetched trainer:", data);
                    const clientArray = data.trainer_profile.clients.map((client: any) => ({
                        id: client.id,
                        username: "", // Placeholder for now, clients field inside of trainer_profile does not contain username (only IDs)
                    }));
                
                    setClients(clientArray); 
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
         
        fetchData();
    }, [userType]); 

    useEffect(() => {
        const fetchTrainerName = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                window.location.href = '/login';
            }

            try {
                const trainerResponse = await fetch(`http://127.0.0.1:8000/personal_trainer/${trainer}/`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });
                const trainerData = await trainerResponse.json();
                setTrainer({ id: trainerData.id, username: trainerData.username });
            } catch (error) {
                console.error("Error fetching trainer name:", error);
            }
        };

        if (trainer) {
            fetchTrainerName();
        }
    }, [trainer]);

    useEffect(() => {
        const fetchClientNames = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                window.location.href = '/login';
            }

            try {
                const updatedClientsWithUsername = await Promise.all(
                    clients.map(async (client) => {
                        const res = await fetch(`http://127.0.0.1:8000/user/${client.id}/`, {
                            method: "GET",
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await res.json();
                        return { ...client, username: data.username };
                    })
                );
                setClients(updatedClientsWithUsername);
            } catch (error) {
                console.error("Error fetching client names:", error);
            }
        };

        if (clients && clients.length > 0) {
            fetchClientNames();
        }
    }, [clients]);

    return (
        <motion.nav className="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
            <motion.div className="container-fluid">
                <Link className="navbar-brand" to="/dashboard">iGym</Link>
                <motion.div className="navbar-nav me-auto"> 
                    <Link className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} to="/dashboard">Home</Link>
                    <Link className={`nav-link ${location.pathname === '/exercises' ? 'active' : ''}`} to="/exercises">Exercises</Link>
                    <Link className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`} to="/calendar">Calendar</Link>
                    <Link className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`} to="/chat">Chat</Link>
                    {userType === "user" && (
                    <Link className={`nav-link ${location.pathname === '/personalTrainers' ? 'active' : ''}`} to="/personalTrainers">
                        Personal Trainers
                    </Link>
                    )}

                    {/* Showing my PT for user */}
                    {userType === "user" && trainer && (
                        <Link className="btn btn-secondary me-3" to={`/personal_trainer/${trainer.id}/`}>
                            {trainer.username} <span role="img" aria-label="pt">💪</span>
                        </Link>
                    )}

                    {/* Dropdown for PT, shows a list of clients */}
                    {userType === "trainer" && (
                    <div className="dropdown me-3">
                        <button
                            className="btn btn-secondary dropdown-toggle"
                            type="button"
                            id="dropdownMenuTrainer"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            My Clients
                        </button>
                        <ul className="dropdown-menu" aria-labelledby="dropdownMenuTrainer">
                        {clients.length > 0 ? (
                            clients.map((client) => (
                            <li key={client.id}>
                                <Link className="dropdown-item" to={`/profile/${client.id}`}>
                                {client.username}
                                </Link>
                            </li>
                            ))
                        ) : (
                            <li>
                            <span className="dropdown-item text-muted">No clients</span>
                            </li>
                        )}
                        </ul>
                    </div>
                    )}


                </motion.div>

                {/* Logout button */}
                <motion.button
                    onClick={handleLogout}
                    className='btn btn-danger ms-auto'  
                    whileHover={{ scale: 1.05 }}
                >
                    Logout
                </motion.button>
            </motion.div>
        </motion.nav>
    );
}

export default NavBar;