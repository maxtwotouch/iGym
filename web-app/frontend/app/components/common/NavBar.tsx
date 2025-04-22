
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { backendUrl } from "~/config";
import defaultProfilePicture from "~/assets/defaultProfilePicture.png";

export const NavBar = () => {
  const location = useLocation();
  const [fullName, setFullName] = useState("");
  const [profileImage, setProfileImage] = useState<string>(defaultProfilePicture);
  const [userType, setUserType] = useState<string | null>(null);
  const [clients, setClients] = useState<{ id: number; first_name: string; last_name: string }[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const clientsRef = useRef<HTMLDivElement>(null);

  // close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (clientsRef.current && !clientsRef.current.contains(e.target as Node)) {
        setClientsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // load user + clients
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const id = localStorage.getItem("user_id");
    if (!token || !id) return;

    fetch(`${backendUrl}/user/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setFullName(`${data.first_name} ${data.last_name}`);
        setProfileImage(data.profile?.profile_picture || defaultProfilePicture);
        setUserType(data.profile ? "user" : "trainer");
      });

    if (userType === "trainer") {
      fetch(`${backendUrl}/personal_trainer/clients/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((arr) =>
          setClients(
            arr.map((c: any) => ({
              id: c.id,
              first_name: c.first_name,
              last_name: c.last_name,
            }))
          )
        );
    }
  }, [userType]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const links = [
    { to: "/dashboard", label: "Home" },
    { to: "/exercises", label: "Exercises" },
    { to: "/calendar", label: "Calendar" },
    { to: "/chat", label: "Chat" },
  ];

  return (
    <motion.nav
      className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <Link to="/dashboard" className="text-2xl font-semibold hover:text-blue-400">
        iGym
      </Link>

      {/* Links */}
      <div className="flex space-x-6">
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`text-sm font-medium ${
              location.pathname === to
                ? "text-blue-300"
                : "text-gray-300 hover:text-blue-400"
            } transition-colors`}
          >
            {label}
          </Link>
        ))}

        {userType === "user" && (
          <Link
            to="/personalTrainers"
            className={`text-sm font-medium ${
              location.pathname === "/personalTrainers"
                ? "text-blue-300"
                : "text-gray-300 hover:text-blue-400"
            } transition-colors`}
          >
            Personal Trainers
          </Link>
        )}
      </div>

      {/* Right side: clients dropdown + profile */}
      <div className="flex items-center space-x-4">
        {userType === "trainer" && (
          <div ref={clientsRef} className="relative">
            <button
              onClick={() => setClientsOpen((o) => !o)}
              className="text-sm text-gray-300 hover:text-white px-3 py-1 rounded transition-colors"
            >
              My Clients
            </button>
            {clientsOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-gray-800 rounded shadow-lg">
                {clients.length > 0 ? (
                  clients.map((c) => (
                    <Link
                      key={c.id}
                      to={`/clients/${c.id}`}
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    >
                      {c.first_name} {c.last_name}
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">No clients</div>
                )}
              </div>
            )}
          </div>
        )}

        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <img
              src={profileImage}
              alt="avatar"
              className="h-8 w-8 rounded-full border-2 border-gray-700 object-cover"
            />
            <span className="hidden sm:block text-sm">{fullName}</span>
            <svg
              className={`h-4 w-4 text-gray-400 transform ${
                profileOpen ? "rotate-180" : ""
              } transition-transform`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-gray-800 rounded shadow-lg">
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              >
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default NavBar;