import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import 'tailwindcss/tailwind.css';
import 'bootstrap/dist/css/bootstrap.css';
import defaultProfilePicture from "../assets/defaultProfilePicture.png";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

interface UserProfile {
  id: number;  
  username: string;
  email: string;
  // For regular users:
  profile?: {
    weight?: number;
    height?: number;
    profile_picture: string;
  };
  // For personal trainers:
  trainer_profile?: {
    weight?: number;
    height?: number;
    profile_picture: string;
    experience: string;
  };
}

/**
 * ProfilePage:
 * - Fetches user info for both regular users and personal trainers.
 * - Lets users edit username, password, height, weight, and upload a profile image.
 */
export default function ProfilePage() {
  const [id, setID] = useState<string | null>(null);  
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Reference to hidden file input (for uploading images)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extend formData to include username, new password, and confirm password fields
  const [formData, setFormData] = useState({
    username: "",
    weight: "",
    height: "",
    password: "",
    confirmPassword: ""
  });

  // Determine user type from localStorage (expected values: "user" or "trainer")
  const userType = localStorage.getItem("userType") || "user";

  // Construct endpoints based on user type
  const userId = localStorage.getItem("user_id");
  const profileEndpoint =
    userType === "trainer"
      ? `${backendUrl}/personal_trainer/${userId}/`
      : `${backendUrl}/user/${userId}/`;
  const updateEndpoint =
    userType === "trainer"
      ? `${backendUrl}/personal_trainer/update/${userId}/`
      : `${backendUrl}/user/update/${userId}/`;

  // 1) Fetch user profile on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("No access token found; redirecting to /login");
      navigate("/login");
      return;
    }

    setID(userId);

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(profileEndpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(`Profile fetch failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log("Profile data received:", data);
        setProfile(data);

        // Initialize form fields using data from either "profile" or "trainer_profile"
        setFormData({
          username: data.username || "",
          weight: (data.profile ? data.profile.weight : data.trainer_profile?.weight)?.toString() || "",
          height: (data.profile ? data.profile.height : data.trainer_profile?.height)?.toString() || "",
          password: "",
          confirmPassword: ""
        });
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, profileEndpoint, userId]);

  // 2) Handle changes for any input field
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3) Handle file input -> preview image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 4) Submit updates -> PATCH request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("No access token found, redirecting to /login");
      navigate("/login");
      return;
    }

    try {
      const submitData = new FormData();
      if (formData.username) {
        submitData.append("username", formData.username);
      }
      if (formData.password) {
        submitData.append("password", formData.password);
      }
      if (formData.weight) {
        submitData.append("profile.weight", formData.weight);
      }
      if (formData.height) {
        submitData.append("profile.height", formData.height);
      }
      if (fileInputRef.current?.files?.[0]) {
        submitData.append("profile.profile_picture", fileInputRef.current.files[0]);
      }

      const response = await fetch(updateEndpoint, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: submitData
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile (status ${response.status})`);
      }

      const updatedProfile = await response.json();
      console.log("Profile updated successfully:", updatedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
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
                    <img
                      src={previewImage}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (profile?.profile?.profile_picture || profile?.trainer_profile?.profile_picture) ? (
                    <img
                      src={profile?.profile?.profile_picture || profile?.trainer_profile?.profile_picture}
                      alt={profile?.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={defaultProfilePicture}
                      alt="Fallback"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
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

              <h2 className="text-xl font-bold text-white mt-4">{profile?.username}</h2>
              {profile?.email && <p className="text-gray-300 mt-1">{profile.email}</p>}
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
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">Username</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-white">{profile?.username}</p>
                    )}
                  </div>
                  {/* Render password fields only if editing */}
                  {isEditing && (
                    <>
                      <div className="mb-4">
                        <label className="block text-gray-300 mb-2">New Password</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-300 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}
                  {/* Weight */}
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
                      <p className="text-white">
                        {(profile?.profile?.weight || profile?.trainer_profile?.weight) ?? "Not specified"}
                      </p>
                    )}
                  </div>
                  {/* Height */}
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
                      <p className="text-white">
                        {(profile?.profile?.height || profile?.trainer_profile?.height) ?? "Not specified"}
                      </p>
                    )}
                  </div>
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