import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { fetchWorkoutSessions } from "~/utils/api/workoutSessions";
import apiClient from "~/utils/api/apiClient";
import { toLocalISOString } from "~/utils/date";
import { useAuth } from "~/context/AuthContext";

type SetInfo = { id: number; repetitions: number; weight: number };
type ExerciseSessionInfo = {
  id: number;
  exercise: { id: number; name: string };
  sets: SetInfo[];
};
type CalendarEvent = {
  id: string;
  workout_id: number;
  title: string;
  start: string;
  calories_burned?: number;
  duration?: string;
  exercise_sessions?: ExerciseSessionInfo[];
  completed: boolean;
  type: "scheduled" | "session" | "pt";
};

function formatDuration(isoDur: string): string {
  const m = isoDur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return isoDur;
  const [, h = "0", mins = "0"] = m;
  return `${parseInt(h, 10)}h ${parseInt(mins, 10)}m`;
}

export const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availableWorkouts, setAvailableWorkouts] = useState<{ id: number; title: string }[]>([]);
  const [clients, setClients] = useState<{ id: number; username: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewALlEventsDay, setViewAllEventsDay] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      // 1) Scheduled workouts
      const schedRes = await apiClient.get("/schedule/workout/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const schedData = schedRes.status === 200 ? schedRes.data : [];
      const sched: CalendarEvent[] = schedData.map((w: any) => ({
        id: `scheduled-${w.id}`,
        workout_id: w.workout_template,
        title: w.workout_title,
        start: w.scheduled_date,
        completed: false,
        type: "scheduled",
      }));

      // 2) Personal workout sessions
      const sessData = await fetchWorkoutSessions();
      const [wkRes, exRes] = await Promise.all([
        apiClient.get("/workout/", { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get("/exercise/", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const workoutsData = wkRes.data;
      const exercisesData = exRes.data;

      const sessions: CalendarEvent[] = (sessData || []).map((s: any) => {
        const workout = workoutsData.find((w: any) => w.id === s.workout);
        return {
          id: `session-${s.id}`,
          workout_id: s.workout,
          title: workout?.name ?? "Workout Session",
          start: s.start_time,
          completed: true,
          type: "session",
          calories_burned: s.calories_burned,
          duration: formatDuration(s.duration),
          exercise_sessions: (s.exercise_sessions || []).map((es: any) => {
            const ex = exercisesData.find((e: any) => e.id === es.exercise);
            return {
              id: es.id,
              exercise: {
                id: es.exercise,
                name: ex?.name ?? "Unknown Exercise",
              },
              sets: es.sets.map((st: any) => ({
                id: st.id,
                repetitions: st.repetitions,
                weight: st.weight,
              })),
            };
          }),
        };
      });

      // 3) PT 1-on-1 sessions
      let ptSched: CalendarEvent[] = [];
      {
        try {
          const r = await apiClient.get("/schedule/pt_workout/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r.status === 200) {
            const now = new Date();
            ptSched = r.data.map((it: any) => {
              const client = clients.find((c) => c.id === it.client);
              const withWhom =
                user && user.userType === "trainer" 
                  ? client?.username ?? "Client"
                  : it.pt_username ?? "Trainer";
              return {
                id: `pt-${it.id}`,
                workout_id: it.workout_template,
                title: `${it.workout_title} with ${withWhom}`,
                start: it.scheduled_date,
                completed: new Date(it.scheduled_date) < now,
                type: "pt",
              };
            });
          }
        } catch {
          console.warn("Skipping PT workouts due to error");
        }
      }

      setEvents([...sched, ...ptSched, ...sessions]);
    } catch (e: any) {
      console.error("Failed to load calendar", e);
      setError(
        `Failed to load calendar: ${e.response?.data?.detail || e.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [navigate, user?.userType, clients, getToken]);

  useEffect(() => {
    if (user?.userType !== "trainer") return;
    (async () => {
      const token = await getToken();
      const res = await apiClient.get("/trainer/clients/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) setClients(res.data);
    })();
  }, [user?.userType, getToken]);

  useEffect(() => {
    apiClient
      .get("/workout/")
      .then((res) => {
        if (res.status === 200) {
          setAvailableWorkouts(
            res.data.map((w: any) => ({ id: w.id, title: w.name }))
          );
        }
      })
      .catch((e) => console.error("Failed to load workouts", e));
  }, []);

  const prevMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const dim = new Date(y, m + 1, 0).getDate();
    const prevDim = new Date(y, m, 0).getDate();
    const days: Date[] = [];
    for (let i = firstDow - 1; i >= 0; i--) days.push(new Date(y, m - 1, prevDim - i));
    for (let d = 1; d <= dim; d++) days.push(new Date(y, m, d));
    let nxt = 1;
    while (days.length < 42) days.push(new Date(y, m + 1, nxt++));
    return days;
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((ev) => {
      const key = new Date(ev.start).toLocaleDateString();
      (map[key] ||= []).push(ev);
    });
    return map;
  }, [events]);

  const onDayClick = (day: Date) => {
    day.setHours(12, 0, 0, 0);
    setSelectedDateTime(toLocalISOString(day));
    setShowSchedule(true);
  };
  const onEventClick = (ev: CalendarEvent) => setSelectedEvent(ev);

  const schedule = async () => {
    if (!selectedWorkoutId || !selectedDateTime) return;
    const schedDate = new Date(selectedDateTime);
    if (schedDate < new Date()) return alert("Cannot schedule in the past");

    const payload: any = { workout_template: selectedWorkoutId, scheduled_date: schedDate.toISOString() };
    let url = "/schedule/workout/create/";
    if (user?.userType === "trainer") {
      if (!selectedClientId) return alert("Please select a client");
      payload.client = selectedClientId;
      url = "/schedule/pt_workout/create/";
    }
    try {
      const res = await apiClient.post(url, payload);
      if (res.status !== 201) throw new Error("Bad status");
      await loadEvents();
      setShowSchedule(false);
      setSelectedWorkoutId(null);
      setSelectedDateTime("");
      setSelectedClientId(null);
    } catch {
      setError("Failed to schedule workout");
    }
  };

  return (
    <motion.div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="spinner-border text-light" role="status" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-center">
          <p>Error loading calendar: {error}</p>
        </div>
      ) : (
        <>
            {/* Calendar */}
            <div className="flex flex-col flex-grow min-h-0 bg-gray-800 text-white rounded-2xl shadow-lg p-6 mt-4">
              <h1 className="text-2xl font-bold text-center mb-4">Workout Calendar</h1>
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer">Prev</button>
                <div className="text-lg font-medium">{currentMonth.toLocaleString("en-uk",{month:"long",year:"numeric"})}</div>
                <button onClick={nextMonth} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer">Next</button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 text-gray-300 text-center text-sm font-semibold border-b border-gray-700 pb-1">
                { ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="py-2">{d}</div>) }
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-gray-700 flex-grow min-h-0">
                {calendarDays.map((day, i) => {
                  const key = day.toLocaleDateString();
                  const isCurrent = day.getMonth() === currentMonth.getMonth();
                  const isToday = key === new Date().toLocaleDateString();
                  const dayEvents = eventsByDate[key] || [];
                  return (
                    <div 
                      key={i} 
                      onClick={() => onDayClick(day)} 
                      className={
                        `flex flex-col p-2 bg-gray-800 hover:bg-gray-700 cursor-pointer ${!isCurrent?"opacity-50" : ""} ${isToday ? "ring-2 ring-blue-500" : ""}` 
                      }
                      data-date={day.toISOString().split("T")[0]}
                    >
                      <span className="text-gray-400 text-sm mb-1">{day.getDate()}</span>
                      <div className="flex flex-col space-y-1 flex-1 overflow-y-auto">
                        {dayEvents.slice(0,3).map(ev => (
                          <div 
                            key={ev.id} 
                            onClick={e=> {
                              e.stopPropagation(); 
                              onEventClick(ev);
                            }} 
                            className={
                              `h-6 rounded text-xs leading-6 px-1 truncate ${ev.type==="session"?"bg-green-600 hover:bg-green-500": ev.type==="pt"?"bg-purple-600 hover:bg-purple-500":"bg-blue-600 hover:bg-blue-500"}`
                            } 
                            title={new Date(ev.start).toLocaleString()}  
                          >
                            {new Date(ev.start).toLocaleTimeString(undefined, {hour:"2-digit",minute:"2-digit"})} – {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-400">
                              +{dayEvents.length - 3} more
                            </div>
                        )}
                        {/* View all events button */}
                        {dayEvents.length > 0 && (
                          <button
                            className="text-xs text-blue-500 hover:text-blue-400 mt-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering scheduling of workout
                              setSelectedDateTime(toLocalISOString(day)); // Current day selected
                              setViewAllEventsDay(true);
                            }}
                          >
                            View All Events
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* View all events modal */}
            {viewALlEventsDay && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-900 p-6 rounded-lg w-96 space-y-4">
                  <h2 className="text-xl font-semibold text-white">All Events for {new Date(selectedDateTime).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</h2>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {eventsByDate[new Date(selectedDateTime).toLocaleDateString()]
                      ?.slice() 
                      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()) 
                      .map((ev) => (
                      <div key={ev.id} onClick={() => { onEventClick(ev); setViewAllEventsDay(false); }} className={`p-3 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-xl ${ev.type==="session"?"bg-green-600 hover:bg-green-500": ev.type==="pt"?"bg-purple-600 hover:bg-purple-500":"bg-blue-600 hover:bg-blue-500"}`} title={new Date(ev.start).toLocaleString()}>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">{ev.title}</span>
                          <span className="text-xs text-gray-200">{new Date(ev.start).toLocaleTimeString(undefined, {hour:"2-digit",minute:"2-digit"})}</span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">
                          {ev.type === "session" ? "✅ Completed" : ev.type === "pt" ? "🤝 1-on-1" : "🗓️ Planned"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setViewAllEventsDay(false)} className="w-full px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white cursor-pointer">Close</button>
                </div>
              </div>
            )}
      

          {/* Schedule Workout Modal */}
          {showSchedule && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-lg w-96 space-y-4">
                <h2 className="text-xl font-semibold text-white">
                  Schedule Workout
                </h2>
                {user?.userType === "trainer" && (
                  <>
                    <label className="text-gray-300">Select Client:</label>
                    <select
                      className="w-full p-2 bg-gray-700 text-white rounded mb-3 cursor-pointer"
                      name="clientSelect"
        
                      value={selectedClientId ?? ""}
                      onChange={(e) =>
                        setSelectedClientId(Number(e.target.value))
                      }
                    >
                      <option value="">-- Select a Client --</option>  
                      {clients.map((c) => (
                        <option 
                          key={c.id} 
                          value={c.id}
                          data-id={c.id}
                        >
                          {c.username}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <label className="text-gray-300">Pick Date & Time:</label>
                <input
                  type="datetime-local"
                  className="w-full p-2 bg-gray-700 text-white rounded mb-3 cursor-pointer"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                  min={toLocalISOString(new Date())}
                />
                <label className="text-gray-300">Select Workout:</label>
                <select 
                  className="w-full p-2 bg-gray-700 text-white rounded mb-3 cursor-pointer"
                  name="workoutSelect" 
                  value={selectedWorkoutId ?? ""}
                  onChange={(e) =>
                    setSelectedWorkoutId(Number(e.target.value))
                  }
                >
                  <option value="">-- Select a Workout --</option>
                  {availableWorkouts.map((w) => (
                    <option key={w.id} value={w.id} data-id={w.id}>
                      {w.title}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowSchedule(false)}
                    className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => schedule()}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 text-white cursor-pointer"
                    name="scheduleButton"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Event Detail Modal */}
          {selectedEvent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-lg w-96 space-y-4">
                {/* Title + Date */}
                <div className="flex justify-between items-baseline">
                  <h2 className="text-2xl font-semibold text-white">
                    💪 {selectedEvent.title}
                  </h2>
                  <span className="text-sm text-gray-400">
                    {new Date(selectedEvent.start).toLocaleDateString(
                      undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      }
                    )}
                  </span>
                </div>
                  {/* Type */}
                  <p className="text-sm mb-2"
                   style={{ color:
                    selectedEvent.type === "session" ? "#4ade80" /*green*/ :
                     selectedEvent.type === "pt"      ? "#c084fc" /*purple*/ :
                     "#93c5fd" /*blue*/ }}>
                      {selectedEvent.type === "session"
                      ? "✅ Completed Session"
                      : selectedEvent.type === "pt"
                      ? "🤝 1-on-1 Session"
                      : "🗓️ Planned Workout"}
                      </p>

                {/* Calories Burned */}
                {selectedEvent.calories_burned != null && (
                  <p className="text-sm text-gray-400">
                    🔥 Calories Burned:{" "}
                    <span className="font-semibold text-white">
                      {Math.round(selectedEvent.calories_burned)}
                    </span>
                  </p>
                )}

                {/* Duration */}
                {selectedEvent.duration && (
                  <p className="text-sm text-gray-400">
                    ⏱ Duration:{" "}
                    <span className="font-semibold text-white">
                      {selectedEvent.duration}
                    </span>
                  </p>
                )}

                {/* Exercises & Sets */}
                {selectedEvent.exercise_sessions && selectedEvent.exercise_sessions.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {selectedEvent.exercise_sessions.map((es) => (
                      <div key={es.id}>
                        <p className="text-white font-semibold">
                          {es.exercise.name}
                        </p>
                        <div className="ml-4 text-sm text-gray-400 space-y-1">
                          {es.sets.map((st, idx) => (
                            <div key={st.id} className="flex justify-between">
                              <span>Set {idx + 1}:</span>
                              <span className="font-semibold text-white">
                                {st.repetitions} reps
                              </span>
                              <span className="font-semibold text-white">
                                {st.weight} kg
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white cursor-pointer"
                    name="closeButton"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};