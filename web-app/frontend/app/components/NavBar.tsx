
import { Link } from 'react-router-dom';
function NavBar () {
    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">GymApp</a>
                <div className="navbar-nav me-auto"> 
                    <a className="nav-link active" href="#">Home</a>
                    <a className="nav-link" href="#">Features</a>
                    <Link className="nav-link" to="/exercises">Exercises</Link>
                </div>
            </div>
        </nav>
    )
}

export default NavBar