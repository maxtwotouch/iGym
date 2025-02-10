import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";

interface TokenPayload {
  user_type: string;
}

const CustomerDashboard: React.FC = () => (
  <div className="p-8">
    <h1 className="text-4xl font-bold mb-4">Customer Dashboard</h1>
    <p className="text-lg">
      Welcome! Browse personal trainers, book sessions, and view your workout history.
    </p>
    {/* Additional customer-specific content */}
  </div>
);

const TrainerDashboard: React.FC = () => (
  <div className="p-8">
    <h1 className="text-4xl font-bold mb-4">Personal Trainer Dashboard</h1>
    <p className="text-lg">
      Welcome! Manage your client appointments, track progress, and update your training packages.
    </p>
    {/* Additional trainer-specific content */}
  </div>
);

const Dashboard: React.FC = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      setUserType("user");
    } catch (error) {
      navigate("/login");
    }
  }, [navigate]);

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {userType === "user" ? <CustomerDashboard /> : <TrainerDashboard />}
    </div>
  );
};

export default Dashboard;