// src/components/NavBar.tsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
// Import the local David Goggins image from your assets folder
import davidGogginsImage from "../goggins.jpg";

type UserProfile = {
  profile_image?: string | null;
};

type UserData = {
  username: string;
  user_profile: UserProfile;
};

function NavBar() {
  const [username, setUsername] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownLocked, setIsDropdownLocked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

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
        const response = await fetch("http://127.0.0.1:8000/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData: UserData = await response.json();
        setUsername(userData.username);

        // If the backend user profile doesn't have an image, use our fallback
        if (userData.user_profile?.profile_image) {
          setProfileImage(userData.user_profile.profile_image);
        } else {
          setProfileImage(davidGogginsImage); // Local fallback image
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // If an error occurs, you could also show the fallback image
        setProfileImage(davidGogginsImage);
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

  // If the user has no username, fallback to 'U' or blank
  const getInitials = () => {
    return username ? username.charAt(0).toUpperCase() : "U";
  };

  return (
    <motion.nav
      className="bg-gradient-to-br from-gray-900 to-gray-800 py-4 shadow-md text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto flex items-center justify-between">
        {/* Left: Logo and Nav Links */}
        <div className="flex items-center space-x-6">
          <motion.div
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link className="text-2xl font-bold" to="/dashboard">
              iGym
            </Link>
          </motion.div>

          <motion.div
            className="flex space-x-4 items-center"
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              className={`hover:text-blue-400 ${location.pathname === "/dashboard" ? "text-blue-400" : ""}`}
              to="/dashboard"
            >
              Home
            </Link>
            <Link
              className={`hover:text-blue-400 ${location.pathname === "/exercises" ? "text-blue-400" : ""}`}
              to="/exercises"
            >
              Exercises
            </Link>
            <Link
              className={`hover:text-blue-400 ${location.pathname === "/calendar" ? "text-blue-400" : ""}`}
              to="/calendar"
            >
              Calendar
            </Link>
            <Link
              className={`hover:text-blue-400 ${location.pathname === "/chat" ? "text-blue-400" : ""}`}
              to="/chat"
            >
              Chat
            </Link>
          </motion.div>
        </div>

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
                    {getInitials()}
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