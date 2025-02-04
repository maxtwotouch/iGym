import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Welcome to GymApp 💪</h1>
      <p>Your fitness journey starts here.</p>
      <nav>
        <Link to="/login">
          <button>Login</button>
        </Link>
        <Link to="/registration">
          <button>Register</button>
        </Link>
      </nav>
    </div>
  );
}