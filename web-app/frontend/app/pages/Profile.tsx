import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import defaultProfilePicture from "~/assets/defaultProfilePicture.png";
import { backendUrl } from "~/config";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(false);
  const [error, setError]           = useState<string|null>(null);
  const [success, setSuccess]       = useState<string|null>(null);
  const [preview, setPreview]       = useState<string|null>(null);
  const fileInputRef               = useRef<HTMLInputElement>(null);

  // form fields
  const [form, setForm] = useState({
    first_name: "",
    last_name:  "",
    username:   "",
    weight:     "",
    height:     "",
    password:   "",
    confirm:    ""
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const id    = localStorage.getItem("user_id");
    if (!token || !id) return navigate("/login");
    fetch(`${backendUrl}/user/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setForm({
          first_name: data.first_name || "",
          last_name:  data.last_name  || "",
          username:   data.username,
          weight:     data.profile?.weight?.toString() || "",
          height:     data.profile?.height?.toString() || "",
          password:   "",
          confirm:    ""
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) {
      return setError("Only images allowed");
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (form.password && form.password !== form.confirm) {
      return setError("Passwords must match");
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

    const res = await fetch(`${backendUrl}/user/update/${id}/`, {
      method:  "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body:    data
    });
    if (!res.ok) {
      const err = await res.text();
      setError(`Failed: ${err}`);
    } else {
      const updated = await res.json();
      setProfile(updated);
      setSuccess("Saved!");
      setEditing(false);
      setPreview(null);
    }
  };

  if (loading) return <div>Loading…</div>;

  return (
    <motion.div className="container mx-auto p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex bg-gray-800 rounded shadow overflow-hidden">
        {/* Image + Name */}
        <div className="w-1/3 bg-gray-700 p-8 text-center">
          <div className="relative mx-auto w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500">
            <img
              src={preview || profile.profile?.profile_picture || defaultProfilePicture}
              className="object-cover w-full h-full"
              alt="avatar"
            />
            {editing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full"
              >
                ✎
              </button>
            )}
          </div>
          <h2 className="text-white mt-4 text-xl">
            {profile.first_name} {profile.last_name}
          </h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="mt-4 px-6 py-2 bg-blue-500 rounded"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Details Form */}
        <div className="flex-1 p-8">
          {error   && <div className="text-red-400 mb-2">{error}</div>}
          {success && <div className="text-green-400 mb-2">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/*" className="hidden" />

            {/* Names + Username */}
            {["first_name","last_name","username"].map(field => (
              <div key={field}>
                <label className="block text-gray-300">{field.replace("_"," ")}</label>
                {editing
                  ? <input
                      name={field}
                      value={(form as any)[field]}
                      onChange={handleChange}
                      className="w-full bg-gray-700 text-white p-2 rounded"
                    />
                  : <p className="text-white">{(profile as any)[field]}</p>
                }
              </div>
            ))}

            {/* Password */}
            {editing && (
              <>
                <div>
                  <label className="block text-gray-300">New password</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full bg-gray-700 text-white p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300">Confirm password</label>
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

            {/* Weight / Height */}
            {["weight","height"].map(field => (
              <div key={field}>
                <label className="block text-gray-300">{field}</label>
                {editing
                  ? <input
                      name={field}
                      type="number"
                      value={(form as any)[field]}
                      onChange={handleChange}
                      className="w-full bg-gray-700 text-white p-2 rounded"
                    />
                  : <p className="text-white">{profile.profile[field] ?? "—"}</p>
                }
              </div>
            ))}

            {editing && (
              <div className="flex space-x-4 mt-4">
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-600 rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 rounded">
                  Save
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
};