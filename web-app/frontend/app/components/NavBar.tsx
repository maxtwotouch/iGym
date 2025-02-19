
import { Link, useLocation } from 'react-router-dom';
function NavBar () {
    const location = useLocation(); // Get the current route
    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">GymApp</a>
                <div className="navbar-nav me-auto"> 
                    <Link className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} to="/dashboard">Home</Link>
                    <Link className={`nav-link ${location.pathname === '/features' ? 'active' : ''}`} to="/features">Features</Link>
                    <Link className={`nav-link ${location.pathname === '/exercises' ? 'active' : ''}`} to="/exercises">Exercises</Link>
                </div>
            </div>
        </nav>
    )
}

export default NavBar