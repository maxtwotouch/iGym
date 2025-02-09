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
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Register for GymApp</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <br />
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <br />
        <div>
          <label>User Type: </label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
          >
            <option value="user">User</option>
            <option value="trainer">Personal Trainer</option>
          </select>
        </div>
        <br />
        {userType === "user" && (
          <>
            <div>
              <label>Weight (kg): </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <br />
            <div>
              <label>Height (cm): </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <br />
          </>
        )}
        {userType === "trainer" && (
          <div>
            <label>Experience: </label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>
        )}
        <br />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}