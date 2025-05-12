import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { backendUrl } from "~/config";

export const RegistrationForm: React.FC = () => {
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [userType, setUserType]     = useState<"user" | "trainer">("user");
  const [weight, setWeight]         = useState("");
  const [height, setHeight]         = useState("");
  const [ptType, setPtType]         = useState("general");
  const [experience, setExperience] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let url = "";
    const payload: any = {
      first_name: firstName,
      last_name:  lastName,
      username,
      password,
    };

    if (userType === "user") {
      url = `${backendUrl}/auth/user/register/`;
      payload.profile = {
        weight: weight ? parseInt(weight, 10) : null,
        height: height ? parseInt(height, 10) : null,
      };
    } else {
      url = `${backendUrl}/auth/personal_trainer/register/`;
      payload.trainer_profile = {
        pt_type: ptType,
        experience,
      };
    }

    try {
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        // collect field errors
        const fieldErrors: string[] = [];
        for (const key in data) {
          const v = data[key];
          fieldErrors.push(
            Array.isArray(v) ? `${key}: ${v.join(" ")}` : `${key}: ${v}`
          );
        }
        alert("Registration failed:\n" + fieldErrors.join("\n"));
        return;
      }

      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      alert("An error occurred during registration.");
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-8 rounded-lg shadow-md w-80 mx-auto"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Names */}
      <div className="mb-4">
        <label className="block mb-1">First Name</label>
        <input
          type="text"
          name="firstName"
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
          name="lastName"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
      </div>

      {/* Username / Password */}
      <div className="mb-4">
        <label className="block mb-1">Username</label>
        <input
          type="text"
          name="username"
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
          name="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
      </div>

      {/* User Type */}
      <div className="mb-4">
        <label className="block mb-1">Register as</label>
        <select
          value={userType}
          name="userType"
          onChange={e => setUserType(e.target.value as any)}
          className="w-full p-2 rounded bg-gray-700 text-white cursor-pointer"
        >
          <option value="user">User</option>
          <option value="trainer">Personal Trainer</option>
        </select>
      </div>

      {/* Conditional Fields */}
      {userType === "user" && (
        <>
          <div className="mb-4">
            <label className="block mb-1">Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Height (cm)</label>
            <input
              type="number"
              name="height"
              value={height}
              onChange={e => setHeight(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
        </>
      )}

      {userType === "trainer" && (
        <>
          <div className="mb-4">
            <label className="block mb-1">Type of Trainer</label>
            <select
              value={ptType}
              onChange={e => setPtType(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white cursor-pointer"
            >
              <option value="general">General Fitness Trainer</option>
              <option value="strength">Strength & Conditioning</option>
              <option value="functional">Functional Training Coach</option>
              <option value="bodybuilding">Bodybuilding Coach</option>
              <option value="physio">Physical Therapist</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">Experience</label>
            <input
              type="text"
              value={experience}
              onChange={e => setExperience(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
        </>
      )}

      <motion.button
        type="submit"
        name="submitButton"
        className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 transition cursor-pointer"
        whileHover={{ scale: 1.05 }}
      >
        Register
      </motion.button>
    </motion.form>
  );
};

export default RegistrationForm;