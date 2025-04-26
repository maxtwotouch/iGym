import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import defaultProfilePicture from "~/assets/defaultProfilePicture.png";
import { backendUrl } from "~/config";

interface UserProfile {
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
}

// Utility to capitalize the start of each word
const formatLabel = (field: string) =>
  field
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile]           = useState<UserProfile | null>(null);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // form state
  const [form, setForm] = useState({
    first_name: "",
    last_name:  "",
    username:   "",
    password:   "",
    confirm:    "",
    weight:     "",
    height:     "",
  });

  // load profile
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const id    = localStorage.getItem("user_id");
    if (!token || !id) {
      navigate("/login");
      return;
    }

    fetch(`${backendUrl}/user/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setForm({
          first_name: data.first_name || "",
          last_name:  data.last_name  || "",
          username:   data.username,
          password:   "",
          confirm:    "",
          weight:     data.profile?.weight?.toString() || "",
          height:     data.profile?.height?.toString() || "",
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (form.password && form.password !== form.confirm) {
      setError("Passwords must match");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const id    = localStorage.getItem("user_id");
    if (!token || !id) return navigate("/login");

    const data = new FormData();
    data.append("first_name", form.first_name);
    data.append("last_name",  form.last_name);
    data.append("username",   form.username);
    if (form.password) data.append("password", form.password);
    data.append("profile.weight", form.weight);
    data.append("profile.height", form.height);
    if (fileInputRef.current?.files?.[0]) {
      data.append("profile.profile_picture", fileInputRef.current.files[0]);
    }

    try {
      const res = await fetch(`${backendUrl}/user/update/${id}/`, {
        method:  "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body:    data
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Update failed");
      }
      const updated = await res.json();
      setProfile(updated);
      setSuccess("Profile saved!");
      setEditing(false);
      setPreviewImage(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Render loading spinner only
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
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
          {/* Avatar Section */}
          <div className="md:w-1/3 bg-gray-700 p-8 flex flex-col items-center">
            <div className="relative">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500">
                <img
                  src={previewImage || profile?.profile?.profile_picture || defaultProfilePicture}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full"
                >
                  ✎
                </button>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mt-4">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-gray-300">{profile?.email}</p>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="mt-6 px-6 py-2 bg-blue-500 rounded"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Form */}
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
                {/** Name & Username **/}
                {['first_name', 'last_name', 'username'].map(field => {
                  const label = formatLabel(field);
                  return (
                    <div key={field}>
                      <label className="block text-gray-300 mb-1">{label}</label>
                      {editing ? (
                        <input
                          name={field}
                          value={(form as any)[field]}
                          onChange={handleChange}
                          className="w-full bg-gray-700 text-white p-2 rounded"
                        />
                      ) : (
                        <p className="text-white">{(profile as any)[field]}</p>
                      )}
                    </div>
                  );
                })}

                {/** Password Fields **/}
                {editing && (
                  <>
                    <div>
                      <label className="block text-gray-300 mb-1">New Password</label>
                      <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full bg-gray-700 text-white p-2 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1">Confirm Password</label>
                      <input
                        name="confirm"
                        type="password"
                        value={form.confirm}
                        onChange={handleChange}
                        className="w-full bg-gray-700 text-white p-2 rounded"
                      />
                    </div>
                  </>
                )}

                {/** Measurement Fields **/}
                {['weight', 'height'].map(field => {
                  const label = formatLabel(field);
                  return (
                    <div key={field}>
                      <label className="block text-gray-300 mb-1">{label}</label>
                      {editing ? (
                        <input
                          name={field}
                          type="number"
                          value={(form as any)[field]}
                          onChange={handleChange}
                          className="w-full bg-gray-700 text-white p-2 rounded"
                        />
                      ) : (
                        <p className="text-white">{profile?.profile?.[field] ?? '—'}</p>
                      )}
                    </div>
                  );
                })}
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
                    className="px-6 py-2 bg-gray-600 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 rounded"
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