import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { backendUrl } from "~/config";

type PT = {
  id: number;
  name: string;
  trainer_profile?: {
    id: number;
    experience: string;
    pt_type: string;
  };
};

const PT_TYPE_MAP: Record<string, string> = {
  all: "All Types",
  general: "General Fitness Trainer",
  strength: "Strength & Conditioning",
  functional: "Functional Training Coach",
  bodybuilding: "Bodybuilding Coach",
  physio: "Physical Therapist",
};

const PtList: React.FC = () => {
  const navigate = useNavigate();
  const [pts, setPts] = useState<PT[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedPt, setSelectedPt] = useState<PT | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    fetch(`${backendUrl}/trainer/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const trainers: PT[] = data.map((pt: any) => ({
          id: pt.id,
          name: pt.username,
          trainer_profile: {
            id: pt.trainer_profile.id,
            experience: pt.trainer_profile.experience,
            pt_type: pt.trainer_profile.pt_type,
          },
        }));
        setPts(trainers);
      })
      .catch((e) => console.error("Failed to load PTs", e));
  }, [navigate]);

  const filteredPts = pts
    .filter((pt) => {
      const matchesName = pt.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || pt.trainer_profile?.pt_type === filterType;
      return matchesName && matchesType;
    })
    .sort((a, b) =>
      sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

  const selectPt = async () => {
    if (!selectedPt) return;
    // ... your existing newPt() logic goes here ...
    // e.g. call your API, create chat, etc.
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Search & Filters */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        />

        <div className="flex space-x-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          >
            {Object.entries(PT_TYPE_MAP).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="asc">A – Z</option>
            <option value="desc">Z – A</option>
          </select>
        </div>
      </div>

      {/* PT Cards */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {pts.length === 0 ? (
          <p className="text-center text-gray-500">Loading trainers…</p>
        ) : filteredPts.length === 0 ? (
          <p className="text-center text-gray-500">No trainers match your search.</p>
        ) : (
          filteredPts.map((pt) => (
            <motion.div
              key={pt.id}
              onClick={() => setSelectedPt(selectedPt?.id === pt.id ? null : pt)}
              whileHover={{ scale: 1.02 }}
              className={`p-5 rounded-lg cursor-pointer shadow-lg flex flex-col transition-colors
                ${
                  selectedPt?.id === pt.id
                    ? "bg-green-600 text-white border-2 border-green-400"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
            >
              <h3 className="text-xl font-semibold">
                {pt.name} – {PT_TYPE_MAP[pt.trainer_profile?.pt_type || "all"]}
              </h3>
              <p className="mt-1 text-gray-200">
                {pt.trainer_profile?.experience || "No experience listed"}
              </p>

              {selectedPt?.id === pt.id && (
                <button
                  onClick={selectPt}
                  className="mt-4 w-full py-2 bg-white text-gray-800 font-semibold rounded hover:bg-gray-200"
                >
                  Confirm Your Personal Trainer
                </button>
              )}
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default PtList;