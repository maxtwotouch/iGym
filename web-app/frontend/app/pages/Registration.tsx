import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

export const RegistrationForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState("user"); 

    // Fields for normal user
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");
    // Field for personal trainer
    const [experience, setExperience] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'; // Vite environment variable for testing or default localhost URL

        // URL and payload based on the user type
        let url = "";
        let payload: any = { username, password, profile: {} };

        if (userType === "user") {
            url = `${backendUrl}/user/register/`;
            payload.profile = {
                weight: weight ? parseInt(weight) : null,
                height: height ? parseInt(height) : null,
            };
        } else if (userType === "trainer") {
            url = `${backendUrl}/personal_trainer/register/`;
            payload.trainer_profile = {
            trainer_profile: {
                experience: experience,
            },
            };
        }

        try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            alert("Registration successful!");
            navigate("/login");
        } else {
            const errorData = await response.json();
            console.error("Registration failed:", errorData);
            alert("Registration failed: " + JSON.stringify(errorData));
        }
        } catch (error) {
        console.error("Error during registration:", error);
        alert("An error occurred during registration.");
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="bg-gray-800 p-8 rounded-lg shadow-md w-80"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mb-4">
                <label className="block mb-1">Username:</label>
                <input
                    type="text"
                    name = "username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    required
                />
            </div>
                <div className="mb-4">
                <label className="block mb-1">Password:</label>
                <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1">User Type:</label>
                <select
                    name="userType"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                >
                    <option value="user">User</option>
                    <option value="trainer">Personal Trainer</option>
                </select>
            </div>
            {userType === "user" && (
            <>
                <div className="mb-4">
                    <label className="block mb-1">Weight (kg):</label>
                    <input
                        type="number"
                        name="weight"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1">Height (cm):</label>
                    <input
                        type="number"
                        name="height"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                </div>
            </>
            )}
            {userType === "trainer" && (
            <>
                <div className="mb-4">
                    <label className="block mb-1">Experience:</label>
                    <input
                        type="text"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                    </div>
            </>
            )}
            <motion.button
                type="submit"
                name="submitButton"
                className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
                whileHover={{ scale: 1.05 }}
            >
                Register
            </motion.button>
        </motion.form>
    );
}