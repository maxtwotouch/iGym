import { motion } from 'framer-motion';
import { useNavigate, Link } from "react-router-dom";


function NavBar () {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        navigate("/login");
    };

    return (
        <motion.nav className="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
            <motion.div className="container-fluid">
                <Link className="navbar-brand" to="/dashboard">iGym</Link>
                <motion.div className="navbar-nav me-auto"> 
                    <Link className={`nav-link ${location.pathname === '/features' ? 'active' : ''}`} to="/features">Features</Link>
                    <Link className={`nav-link ${location.pathname === '/exercises' ? 'active' : ''}`} to="/exercises">Exercises</Link>
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
    )
}

export default NavBar