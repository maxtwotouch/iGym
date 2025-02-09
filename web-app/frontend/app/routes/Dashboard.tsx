// Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";  // Note: default import

interface TokenPayload {
  user_type: string;

}

// Dashboard view for normal customers
const CustomerDashboard: React.FC = () => (
  <div>
    <h1>Customer Dashboard</h1>
    <p>
      Welcome! Here you can browse personal trainers, book sessions, and view your
      workout history.
    </p>

  </div>
);

// Dashboard view for personal trainers
const TrainerDashboard: React.FC = () => (
  <div>
    <h1>Personal Trainer Dashboard</h1>
    <p>
      Welcome! Here you can manage your client appointments, track client progress, and
      update your training packages.
    </p>
 
  </div>
);

const Dashboard: React.FC = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    console.log("Retrieved token:", token);
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      console.log("Decoded token:", decoded);
      if (!decoded.user_type) {
        console.error("No user_type found in token.");
      }
      setUserType(decoded.user_type);
    } catch (error) {
      console.error("Error decoding token:", error);
      navigate("/login");
    }
  }, [navigate]);

  if (!userType) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      {userType === "user" ? <CustomerDashboard /> : <TrainerDashboard />}
    </div>
  );
};

export default Dashboard;