import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { useAuth } from "~/context/AuthContext";
import apiClient from "~/utils/api/apiClient";
import defaultProfilePicture from "~/assets/defaultProfilePicture.jpg";

type Profile = { profile_picture?: string | null };
type User =    { id: number; username: string; profile: Profile };
type TrainerProfile = { id: number; experience: string; profile_picture?: string | null };
type Trainer = { id: number; username: string; trainer_profile: TrainerProfile };

export const NavBar: React.FC = () => {
  const { user, logout, updateUserContext } = useAuth();            // must provide .userId
  const location          = useLocation();
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const clientsDropdownRef = useRef<HTMLDivElement>(null);

  const [profileImage,   setProfileImage]   = useState(defaultProfilePicture);
  const [trainer,        setTrainer]        = useState<Trainer|null>(null);
  const [clients,        setClients]        = useState<User[]>([]);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isClientsDropdownOpen, setIsClientsDropdownOpen] = useState(false);

  // --- 1) On mount: fetch either /user/:id/ or fallback to /trainer/:id/ ---
  useEffect(() => {
    if (!user?.userId) return;
    const load = async () => {
      setProfileImage(user?.profile.profile_picture || defaultProfilePicture);
    };
    load();
  }, [user?.userId]);

  // --- 2) Once we know our type, fetch the other list: trainer→clients, user→their trainer ---
  useEffect(() => {
    if (!user?.userType || !user?.userId) return;
    const loadList = async () => {
      try {
        if (user?.userType === "user") {
          const allTrainers = await apiClient.get<Trainer[]>(`/trainer/`);
          const me = user;
          // `profile.personal_trainer` holds the trainer_profile.id on the server
          const found = allTrainers.data.find(
            t => t.trainer_profile.id === (me.profile as any).personal_trainer
          );
          if (found) setTrainer(found);
        } else {
          // Trainer → list clients
          const c = await apiClient.get<User[]>(`/trainer/clients/`);
          setClients(c.data);
        }
      } catch (e) {
        console.error("Error fetching trainer/clients:", e);
      }
    };
    loadList();
  }, [user]);

  // --- 3) Click outside handlers ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (clientsDropdownRef.current && !clientsDropdownRef.current.contains(event.target as Node)) {
        setIsClientsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    setIsClientsDropdownOpen(false);
  };

  const toggleClientsDropdown = () => {
    setIsClientsDropdownOpen(!isClientsDropdownOpen);
    setIsProfileDropdownOpen(false);
  };

  // --- 4) Logout ---
  const handleLogout = () => logout();


  return (
    <motion.nav
      className="bg-gradient-to-br from-gray-900 to-gray-800 py-4 shadow-md text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto flex items-center space-x-6">
        {/* Logo */}
        <motion.div initial={{ x: -20 }} animate={{ x: 0 }} transition={{ duration: 0.5 }}>
          <Link to="/dashboard" className="text-2xl font-bold">iGym</Link>
        </motion.div>

        {/* Main nav links */}
        <motion.div
          className="flex space-x-4 items-center"
          initial={{ y: -10 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
        >
          <Link 
            to="/dashboard"     
            className={`hover:text-blue-400 ${location.pathname==='/dashboard'      && "text-blue-400"}`}
          >
            Home
          </Link>
          <Link 
            to="/exercises"     
            className={`hover:text-blue-400 ${location.pathname==='/exercises'     && "text-blue-400"}`}
            data-name="Exercises"
          >
            Exercises
          </Link>
          <Link 
            to="/calendar"      
            className={`hover:text-blue-400 ${location.pathname==='/calendar'      && "text-blue-400"}`}
            data-name="Calendar"
          >
            Calendar
          </Link>
          <Link 
            to="/chat"          
            className={`hover:text-blue-400 ${location.pathname==='/chat'          && "text-blue-400"}`}
            data-name="Chat"
          >
            Chat
          </Link>

          {user?.userType==="user" && (
            <>
              <Link 
                to="/personalTrainers" 
                className={`hover:text-blue-400 ${location.pathname==='/personalTrainers' && "text-blue-400"}`}
                data-name="Personal Trainers"
              >
                Personal Trainers
              </Link>
            </>
          )}

          {user?.userType==="trainer" && (
            <div ref={clientsDropdownRef} className="relative">
              <button 
                onClick={toggleClientsDropdown}
                className={`bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 ${isClientsDropdownOpen ? 'bg-gray-600' : ''}`}
                name="clientsButton"
              >
                My Clients
              </button>
              {isClientsDropdownOpen && (
                <motion.ul
                  className="absolute left-0 top-full mt-1 bg-gray-800 py-2 rounded shadow-lg z-10 min-w-[200px]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {clients.length > 0 
                    ? clients.map(c => (
                        <li key={c.id}>
                          <Link 
                            to={`/clients/${c.id}`} 
                            className="block px-4 py-2 hover:bg-gray-700"
                            data-id={c.id}
                            onClick={() => setIsClientsDropdownOpen(false)}
                          >
                            {c.username}
                          </Link>
                        </li>
                      ))
                    : <li className="px-4 py-2 text-gray-400">No clients</li>
                  }
                </motion.ul>
              )}
            </div>
          )}
        </motion.div>

        <div className="flex-1" />

        {/* Profile picture + dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={toggleProfileDropdown}
            className="flex items-center focus:outline-none"
          >
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-blue-500 flex-shrink-0">
              <img src={profileImage} alt={user?.username} className="w-full h-full object-cover" />
            </div>
            <span className="ml-2 hidden md:inline text-sm font-medium">{`${user?.firstName} ${user?.lastName}`}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ml-1 transition-transform ${isProfileDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isProfileDropdownOpen && (
            <motion.div
              className="absolute right-0 top-full mt-2 z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gray-800 rounded-md shadow-xl overflow-hidden min-w-[200px]">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Profile
                  </div>
                </Link>
                <div className="border-t border-gray-700 my-1" />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default NavBar;