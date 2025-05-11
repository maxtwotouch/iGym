import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import defaultProfilePicture from "~/assets/defaultProfilePicture.jpg";
import apiClient from "~/utils/api/apiClient";
import { useAuth } from "~/context/AuthContext";

type UserProfileResponse = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  profile?: {
    weight?: number;
    height?: number;
    profile_picture?: string;
  };
  trainer_profile?: {
    experience: string;
    pt_type: string;
    profile_picture?: string;
  };
};

const formatLabel = (field: string) =>
  field
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserContext } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isTrainer, setIsTrainer] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    confirm: "",
    weight: "",
    height: "",
    experience: "",
    pt_type: "",
  });

  useEffect(() => {
    const initForm = (data: UserProfileResponse) => {
      setProfileData(data);
      setForm({
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        password: "",
        confirm: "",
        weight: data.profile?.weight?.toString() || "",
        height: data.profile?.height?.toString() || "",
        experience: data.trainer_profile?.experience || "",
        pt_type: data.trainer_profile?.pt_type || "",
      });
    };

    const load = async () => {
      try {
        if (user?.userType === "user") {
          const userRes = await apiClient.get<UserProfileResponse>(
            `/user/${user.userId}/`
          );
          setIsTrainer(false);
          initForm(userRes.data);
        } else if (user?.userType === "trainer") {
          const ptRes = await apiClient.get<UserProfileResponse>(
            `/trainer/${user.userId}/`
          );
          setIsTrainer(true);
          initForm(ptRes.data);
        }
      } catch (e: any) {
        console.error("Failed to load profile data", e);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) {
      setError("Please select an image file");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    // Check file size (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      setError("Image size must be less than 4MB");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    else {  
      const reader = new FileReader();
      reader.onload = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (form.password && form.password !== form.confirm) {
      setError("Passwords must match");
      return;
    }

    const data = new FormData();
    data.append("first_name", form.first_name);
    data.append("last_name", form.last_name);
    data.append("username", form.username);
    if (form.password) data.append("password", form.password);

    if (isTrainer) {
      data.append("trainer_profile.experience", form.experience);
      data.append("trainer_profile.pt_type", form.pt_type);
    } else {
      data.append("profile.weight", form.weight);
      data.append("profile.height", form.height);
    }

    const file = fileInputRef.current?.files?.[0];
    if (file) {
      const key = isTrainer
        ? "trainer_profile.profile_picture"
        : "profile.profile_picture";
      data.append(key, file);
    }

    try {
      const endpoint = isTrainer
        ? `/trainer/update/${user?.userId}/`
        : `/user/update/${user?.userId}/`;
      const res = await apiClient.patch<UserProfileResponse>(endpoint, data);
      setProfileData(res.data);
      setSuccess("Profile saved!");
      setEditing(false);
      setPreviewImage(null);
      // After saving, update the user context
      await updateUserContext();
    } catch (e: any) {
      console.error("Error saving profile:", e);
      setError(e.message);
    }
  };

  if (loading || !profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-16 w-16 border-t-4 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 bg-gray-700 p-8 flex flex-col items-center">
            <div className="relative">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500">
                <img
                  src={
                    previewImage ||
                    (isTrainer
                      ? profileData.trainer_profile?.profile_picture
                      : profileData.profile?.profile_picture) ||
                    defaultProfilePicture
                  }
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer"
                >
                  ✎
                </button>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mt-4">
              {profileData.first_name} {profileData.last_name}
            </h2>
            <p className="text-gray-300">{profileData.email}</p>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="mt-6 px-6 py-2 bg-blue-500 rounded cursor-pointer"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="md:w-2/3 p-8">
            {error && <div className="text-red-400 mb-4">{error}</div>}
            {success && <div className="text-green-400 mb-4">{success}</div>}

            <form onSubmit={handleSubmit}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />

              <div className="grid md:grid-cols-2 gap-6">
                {["first_name", "last_name", "username"].map(f => (
                  <div key={f}>
                    <label className="block text-gray-300 mb-1">
                      {formatLabel(f)}
                    </label>
                    {editing ? (
                      <input
                        name={f}
                        value={(form as any)[f]}
                        onChange={handleChange}
                        className="w-full bg-gray-700 text-white p-2 rounded"
                      />
                    ) : (
                      <p className="text-white">{(profileData as any)[f]}</p>
                    )}
                  </div>
                ))}

                {isTrainer ? (
                  <>
                    <div>
                      <label className="block text-gray-300 mb-1">
                        Experience
                      </label>
                      {editing ? (
                        <input
                          name="experience"
                          value={form.experience}
                          onChange={handleChange}
                          className="w-full bg-gray-700 text-white p-2 rounded"
                        />
                      ) : (
                        <p className="text-white">
                          {profileData.trainer_profile!.experience}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-1">
                        PT Type
                      </label>
                      {editing ? (
                        <select
                          name="pt_type"
                          value={form.pt_type}
                          onChange={handleChange}
                          className="w-full bg-gray-700 text-white p-2 rounded cursor-pointer"
                        >
                          {[
                            ["general", "General Fitness Trainer"],
                            ["strength", "Strength & Conditioning"],
                            ["functional", "Functional Coach"],
                            ["bodybuilding", "Bodybuilding Coach"],
                            ["physio", "Physical Therapist"],
                          ].map(([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-white">
                          {profileData.trainer_profile!.pt_type}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {["weight", "height"].map(f => (
                      <div key={f}>
                        <label className="block text-gray-300 mb-1">
                          {formatLabel(f)}
                        </label>
                        {editing ? (
                          <input
                            name={f}
                            type="number"
                            value={(form as any)[f]}
                            onChange={handleChange}
                            className="w-full bg-gray-700 text-white p-2 rounded"
                          />
                        ) : (
                          <p className="text-white">
                            {profileData.profile?.[f as keyof typeof profileData.profile] ?? "—"}
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {editing && (
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setPreviewImage(null);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="px-6 py-2 bg-gray-600 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 rounded cursor-pointer"
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
  );
};

export default ProfilePage;