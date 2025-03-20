// src/pages/ProfilePage.tsx

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import 'tailwindcss/tailwind.css';
import 'bootstrap/dist/css/bootstrap.css';


import davidGogginsImage from "../assets/goggins.jpg";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

interface UserProfile {
  username: string;
  email?: string;
  profile_image?: string;
  weight?: number;
  height?: number;
  age?: number;
  goals?: string;
  experience_level?: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields state
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    age: "",
    goals: "",
    experience_level: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch user profile
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${backendUrl}/api/user/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
        
        // Initialize form data with existing profile info
        setFormData({
          weight: data.weight?.toString() || "",
          height: data.height?.toString() || "",
          age: data.age?.toString() || "",
          goals: data.goals || "",
          experience_level: data.experience_level || ""
        });
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.match('image.*')) {
      setError("Please select an image file");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // Create form data for multipart/form-data to handle file uploads
      const submitData = new FormData();
      
      // Add form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value);
      });
      
      // Add profile image if selected
      if (fileInputRef.current?.files?.[0]) {
        submitData.append('profile_image', fileInputRef.current.files[0]);
      }

      // Send update request
      const response = await fetch(`${backendUrl}/api/user/profile/update/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: submitData
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      
      // Clear preview after successful update
      setPreviewImage(null);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <NavBar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Helper to get user's first initial (for fallback text, if needed)
  // const getUserInitial = () => profile?.username?.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <NavBar />
      
      <motion.div 
        className="flex-grow container mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            
            {/* Profile Image Section */}
            <div className="md:w-1/3 bg-gray-700 p-8 flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500">
                  {previewImage ? (
                    // 2) If user has chosen a new image, show preview
                    <img 
                      src={previewImage} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : profile?.profile_image ? (
                    // 3) If user already has a profile image from the backend, show it
                    <img 
                      src={profile.profile_image} 
                      alt={profile.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // 4) If no profile image at all, show your local fallback image
                    <img
                      src={davidGogginsImage}
                      alt="Fallback"
                      className="w-full h-full object-cover"
                    />
                    // Or if you prefer to show the user's initial:
                    /*
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      <span className="text-4xl text-gray-300">
                        {getUserInitial()}
                      </span>
                    </div>
                    */
                  )}
                </div>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path 
                        fillRule="evenodd" 
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" 
                        clipRule="evenodd" 
                      />
                      <path d="M7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
                    </svg>
                  </button>
                )}
              </div>

              <h2 className="text-xl font-bold text-white mt-4">
                {profile?.username}
              </h2>
              {profile?.email && (
                <p className="text-gray-300 mt-1">{profile.email}</p>
              )}
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            {/* Profile Details Section */}
            <div className="md:w-2/3 p-8">
              <h3 className="text-2xl font-bold text-white border-b border-gray-700 pb-4 mb-6">
                {isEditing ? "Edit Profile" : "Profile Details"}
              </h3>
              
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {successMessage && (
                <div className="bg-green-900/50 border border-green-700 text-green-100 px-4 py-3 rounded mb-4">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Hidden file input for the profile image */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">Weight (kg)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-white">{profile?.weight || "Not specified"}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">Height (cm)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-white">{profile?.height || "Not specified"}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">Age</label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-white">{profile?.age || "Not specified"}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">Experience Level</label>
                    {isEditing ? (
                      <select
                        name="experience_level"
                        value={formData.experience_level}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    ) : (
                      <p className="text-white capitalize">
                        {profile?.experience_level || "Not specified"}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Goals</label>
                  {isEditing ? (
                    <textarea
                      name="goals"
                      value={formData.goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-white">
                      {profile?.goals || "No goals specified"}
                    </p>
                  )}
                </div>
                
                {isEditing && (
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setPreviewImage(null);
                      }}
                      className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}