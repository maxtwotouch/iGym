import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

function NavBar() {
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        window.location.href = '/login';
    };

    return (
        <motion.nav className="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
            <motion.div className="container-fluid">
                <Link className="navbar-brand" to="/dashboard">iGym</Link>
                <motion.div className="navbar-nav me-auto"> 
                    <Link className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} to="/dashboard">Home</Link>
                    <Link className={`nav-link ${location.pathname === '/exercises' ? 'active' : ''}`} to="/exercises">Exercises</Link>
                    <Link className={`nav-link ${location.pathname === '/calender' ? 'active' : ''}`} to="/calender">Exercises</Link>

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