import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import defaultProfilePicture from "../images/defaultProfilePicture.png"

type Profile = {
    profile_picture?: string | null;
  };

type Trainer = {
    id: number;
    username: string;
    trainer_profile: TrainerProfile;
}

type TrainerProfile = {
    id : number;
    experience: string;
}
  
type User = {
    id: number;
    username: string;
    profile: Profile;
  };

function NavBar() {
    const [username, setUsername] = useState<string>("");
    const [clients, setClients] = useState<User []>([]);
    const [trainer, setTrainer] = useState<Trainer | null>(null);
    const [userType, setUserType] = useState<string | null>(null);
    const location = useLocation();

    const [profileImage, setProfileImage] = useState<string | null>(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDropdownLocked, setIsDropdownLocked] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);

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
                        if (trainer.trainer_profile.id === userData.profile.personal_trainer) {
                            setTrainer({ id: trainer.id, username: trainer.username, trainer_profile: trainer.trainer_profile });
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
                        setClients((prevClients) => [...prevClients, { id: client.id, username: client.username, profile: client.profile }]);
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
         
        fetchTrainerOrClients();
    }, [userType]); 

    useEffect(() => {
        // Close the dropdown if clicking outside
        function handleClickOutside(event: MouseEvent) {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
            setIsDropdownLocked(false);
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
    
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);

    useEffect(() => {
    // Cleanup any pending timeouts
    return () => {
        if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        }
    };
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          // If no token, force the user to login
          window.location.href = "/login";
          return;
        }
    
        // Fetch the user data
        const fetchUserData = async () => {
          try {
            const id = localStorage.getItem("user_id")
            const response = await fetch(`http://127.0.0.1:8000/user/${id}/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
    
            if (!response.ok) {
              throw new Error("Failed to fetch user data");
            }
    
            const userData: User = await response.json();
            setUsername(userData.username);

            console.log("profile_image: ", userData.profile.profile_picture)
    
            // If the backend user profile doesn't have an image, use our fallback
            if (userData.profile?.profile_picture) {
              setProfileImage(userData.profile.profile_picture);
            } else {
              setProfileImage(defaultProfilePicture); // Local fallback image
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            // If an error occurs, you could also show the fallback image
            setProfileImage(defaultProfilePicture);
          }
        };
    
        fetchUserData();
      }, []);
    
        // Toggle dropdown on click
  const handleToggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
    setIsDropdownLocked((prev) => !prev);
  };

  // Hover logic
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    if (isDropdownLocked) return;
    timeoutRef.current = window.setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };


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
                    <Link 
                        className={`hover:text-blue-400 ${location.pathname === '/exercises' ? 'text-blue-400' : ''}`} 
                        to="/exercises"
                        data-name="Exercises Page"
                        >
                        Exercises
                    </Link>
                    <Link 
                        className={`hover:text-blue-400 ${location.pathname === '/calendar' && 'text-blue-400'}`} 
                        to="/calendar"
                        data-name="Calendar"
                        >
                        Calendar
                    </Link>
                    
                    <Link 
                        className={`hover:text-blue-400 ${location.pathname === '/chat' && 'text-blue-400'}`}
                        to="/chat"
                        data-name="Chat Page"
                        >
                        Chat
                    </Link>
                    
                    {/* Selecting PT only for User */}
                    {userType === "user" && (
                    <Link 
                        className={`hover:text-blue-400 ${location.pathname === '/personalTrainers' && 'text-blue-400'}`}
                        to="/personalTrainers"
                        data-name="Personal Trainers"
                        >
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
                                            to={`/clients/${client.id}`}
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

                {/* Right: Profile Image / Dropdown */}
                <div
                    ref={dropdownRef}
                    className="relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={handleToggleDropdown}
                    >
                    {/* Profile Picture with fallback */}
                    <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-blue-500 flex-shrink-0">
                    {profileImage ? (
                        <img
                        src={profileImage}
                        alt={username}
                        className="h-full w-full object-cover"
                        />
                    ) : (
                    <div className="h-full w-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                            {username}
                        </span>
                    </div>
                    )}
                </div>
                
                {/* Username text */}
                <span className="ml-2 hidden md:inline text-sm font-medium">{username}</span>

                {/* Dropdown arrow */}
                <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-1 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div
                    className="absolute right-0 top-full pt-2 z-10"
                    style={{ minWidth: "200px" }}
                    >
                    <div className="bg-gray-800 rounded-md shadow-xl overflow-hidden">
                        <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white"
                            >
                            <div className="flex items-center">
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                                </svg>
                                View Profile
                            </div>
                        </Link>
                        <div className="border-t border-gray-700 my-1"></div>
                        <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
                            >
                            <div className="flex items-center">
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            Logout
                        </div>
                        </button>
                    </div>
                    </div>
                )}
                </div>
            </div>
        </motion.nav>
    );
}

export default NavBar;