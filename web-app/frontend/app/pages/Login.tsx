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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    try {
      await login({ username, password }).then((success) => {
        console.log("Login success:", success);
        if (success) {
          // Redirect to the page they were trying to access
          navigate(from);
        } else {
          alert("Login failed. Please check your credentials.");
        }
      });

      // if (response.ok) {
      //   const data = await response.json();
      //   console.log("Login successful:", data);

      //   // Store JWT tokens
      //   localStorage.setItem("accessToken", data.access);
      //   localStorage.setItem("refreshToken", data.refresh);
      //   localStorage.setItem("username", data.username);
      //   localStorage.setItem("user_id", data.id ?? "unknown"); // Ensure ID is stored
        
      //   console.log(data);

      //   // Store user type
      //   if (data.profile?.role) {
      //     localStorage.setItem("userType", data.profile.role);
      //   } else if (data.trainer_profile?.role) {
      //     if (data.trainer_profile.role === "personal_trainer") {
      //       localStorage.setItem("userType", "trainer");
      //     }
      //   }

      //   // Store weight for user role
      //   if (data.profile?.role === "user") {
      //     console.log("storing the user's weight");
      //     localStorage.setItem("weight", data.profile.weight ?? "unknown");
      //   }

      //   navigate("/dashboard");
      // } else {
      //   const errorData = await response.json();
      //   console.error("Login failed:", errorData);
      //   alert("Login failed: " + (errorData.detail || "Unknown error"));
      // }
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
        <input
            type="text"  // Changed from "username" to "text"
            name="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
            required
        />
        <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
            required
        />
        <motion.button
            type="submit"
            name="loginButton"
            className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
            whileHover={{ scale: 1.05 }}
        >
            Login
        </motion.button>
    </motion.form>
  );
}