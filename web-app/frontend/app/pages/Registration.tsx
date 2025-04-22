import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { backendUrl } from "~/config";

export const RegistrationForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [userType, setUserType]   = useState<"user"|"trainer">("user");

  // user fields
  const [weight, setWeight]     = useState("");
  const [height, setHeight]     = useState("");
  // trainer field
  const [experience, setExperience] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let url = "";
    // top‑level name + username + password
    const payload: any = { 
      first_name: firstName,
      last_name:  lastName,
      username,
      password,
    };

    if (userType === "user") {
      url = `${backendUrl}/user/register/`;
      payload.profile = {
        weight:  weight ? parseInt(weight, 10) : null,
        height:  height ? parseInt(height, 10) : null,
      };
    } else {
      url = `${backendUrl}/personal_trainer/register/`;
      payload.trainer_profile = {
        experience,
      };
    }

    try {
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Registration successful!");
        navigate("/login");
      } else {
        const err = await res.json();
        alert("Failed to register: " + JSON.stringify(err));
      }
    } catch (err) {
      console.error(err);
      alert("Network error during registration");
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
      {/* FIRST / LAST */}
      <div className="mb-4">
        <label className="block mb-1">First Name</label>
        <input
          type="text"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Last Name</label>
        <input
          type="text"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
      </div>
      {/* USERNAME / PASSWORD */}
      <div className="mb-4">
        <label className="block mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
      </div>

      {/* USER TYPE */}
      <div className="mb-4">
        <label className="block mb-1">Register as</label>
        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value as any)}
          className="w-full p-2 rounded bg-gray-700 text-white"
        >
          <option value="user">User</option>
          <option value="trainer">Personal Trainer</option>
        </select>
      </div>

      {/* Conditional extra fields */}
      {userType === "user" && (
        <>
          <div className="mb-4">
            <label className="block mb-1">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
        </>
      )}
      {userType === "trainer" && (
        <div className="mb-4">
          <label className="block mb-1">Experience</label>
          <input
            type="text"
            value={experience}
            onChange={e => setExperience(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
      )}

      <motion.button
        type="submit"
        className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
        whileHover={{ scale: 1.05 }}
      >
        Register
      </motion.button>
    </motion.form>
  );
};