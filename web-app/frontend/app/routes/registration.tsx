import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegistrationForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user"); // "user" or "trainer"

  // Fields for normal user
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  // Field for personal trainer
  const [experience, setExperience] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // URL based on the user type.
    let url = "";
    let payload: any = { username, password };

    if (userType === "user") {
      url = "http://127.0.0.1:8000/user/register/";
      payload.profile = {
        weight: weight ? parseInt(weight) : null,
        height: height ? parseInt(height) : null,
      };
    } else if (userType === "trainer") {
      url = "http://127.0.0.1:8000/personal_trainer/register/";
      payload.trainer_profile = {
        experience,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-6">Register for GymApp</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-md w-80">
        <div className="mb-4">
          <label className="block mb-1">Username:</label>
          <input
            type="text"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">User Type:</label>
          <select
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
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Height (cm):</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
          </>
        )}
        {userType === "trainer" && (
          <div className="mb-4">
            <label className="block mb-1">Experience:</label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
        )}
        <button type="submit" className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 transition">
          Register
        </button>
      </form>
    </div>
  );
}