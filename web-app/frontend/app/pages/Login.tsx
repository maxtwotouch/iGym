import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { useAuth } from "~/context/AuthContext";

export const LoginForm = () => {
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("redirectTo") || "/dashboard";

  //
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    try {
      await login({ username, password }).then(async (success) => {
        if (success) {
          
          // Redirect to the page they were trying to access
          navigate(from);
        } 
      });

    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login. Please try again later.");
    }
  };

  return (
    <motion.form
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-lg shadow-md w-80"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Username input */}
        <input
            type="text"  // Changed from "username" to "text"
            name="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
            required
        />
        {/* Password input */}
        <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
            required
        />
        {/* Login button */}
        <motion.button
            type="submit"
            name="loginButton"
            className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 transition cursor-pointer"
            whileHover={{ scale: 1.05 }}
        >
            Login
        </motion.button>
    </motion.form>
  );
}