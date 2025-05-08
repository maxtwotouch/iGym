import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { fetchScheduledWorkouts } from "~/utils/api/scheduledWorkouts";
import { mapWorkoutSessionsToCalendarEvents } from "~/utils/calendarHelper";
import apiClient from "~/utils/api/apiClient";
import { toLocalISOString } from "~/utils/date";
import { useAuth } from "~/context/AuthContext";

type CalendarEvent = {
  id: string;
  workout_id: number;
  title: string;
  start: string;
  end?: string;
  duration?: string;
  completed: boolean;
};

export const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();

  // State
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availableWorkouts, setAvailableWorkouts] = useState<{ id: number; title: string }[]>([]);
  const [clients, setClients] = useState<{ id: number; username: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Schedule modal
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // Event detail
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch clients when trainer logs in
  useEffect(() => {
    if (user?.userType !== "trainer") return;
    (async () => {
      try {
        const token = await getToken();
        const res = await apiClient.get("/trainer/clients/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) setClients(res.data);
      } catch (e) {
        console.error("Failed to fetch clients", e);
      }
    })();
  }, [user?.userType, getToken]);

  // Load all events
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 1) generic scheduled workouts
        const sched = await fetchScheduledWorkouts();

        // 2) PT-scheduled workouts
        const token = await getToken();
        const r = await apiClient.get("/schedule/pt_workout/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        let ptSched: CalendarEvent[] = [];
        if (r.status === 200) {
          const now = new Date();
          ptSched = r.data.map((it: any) => {
            const withWhom =
              user?.userType === "trainer"
                ? clients.find((c) => c.id === it.client)?.username ?? "Client"
                : it.pt_username ?? "Trainer";
            return {
              id: `pt-${it.id}`,
              workout_id: it.workout_template,
              title: `${it.workout_title} with ${withWhom}`,
              start: it.scheduled_date,
              completed: new Date(it.scheduled_date) < now,
            };
          });
        }

        // 3) workout sessions
        const sessions = await mapWorkoutSessionsToCalendarEvents();

        setEvents([
          ...sched.map((ev) => ({ ...ev, completed: false })),
          ...ptSched,
          ...sessions.map((ev) => ({
            ...ev,
            completed: ev.end ? new Date(ev.end) < new Date() : false,
          })),
        ]);
      } catch (e) {
        console.error("Failed to load calendar", e);
        setError("Failed to load calendar");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, user?.userType, clients, getToken]);

  // Load workout templates
  useEffect(() => {
    apiClient
      .get("/workout/")
      .then((res) => {
        if (res.status === 200) {
          setAvailableWorkouts(res.data.map((w: any) => ({ id: w.id, title: w.name })));
        }
      })
      .catch((e) => console.error("Failed to load workouts", e));
  }, []);

  // Calendar grid helpers
  const prevMonth = () =>
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear(),
      m = currentMonth.getMonth();
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

  // Modal handlers
  const onDayClick = (day: Date) => {
    day.setHours(12, 0, 0, 0);
    setSelectedDateTime(toLocalISOString(day));
    setShowSchedule(true);
  };
  const onEventClick = (ev: CalendarEvent) => setSelectedEvent(ev);

  // Schedule POST
  const schedule = async () => {
    if (!selectedWorkoutId || !selectedDateTime) return;
    const scheduledDate = new Date(selectedDateTime);
    const now = new Date();
    if (scheduledDate < now) {
      alert("Cannot schedule in the past");
      return;
    }

    const isoForBackend = scheduledDate.toISOString();
    const isPT = user?.userType === "trainer";
    const payload: any = {
      workout_template: selectedWorkoutId,
      scheduled_date: isoForBackend,
    };
    let url = "/schedule/workout/create/";

    if (isPT) {
      if (!selectedClientId) {
        alert("Please select a client");
        return;
      }
      payload.client = selectedClientId;
      url = "/schedule/pt_workout/create/";
    }

    try {
      const res = await apiClient.post(url, payload);
      if (res.status !== 201) throw new Error("Bad status");
      const ns = res.data;
      let title = ns.workout_title;
      if (isPT) {
        const withWhom =
          clients.find((c) => c.id === selectedClientId)?.username ?? "Client";
        title = `${ns.workout_title} with ${withWhom}`;
      }

      setEvents((prev) => [
        ...prev,
        {
          id: `${isPT ? 'pt-' : 'scheduled-'}${ns.id}`,
          workout_id: ns.workout_template,
          title,
          start: ns.scheduled_date,
          completed: false,
        },
      ]);

      setShowSchedule(false);
      setSelectedWorkoutId(null);
      setSelectedDateTime("");
      setSelectedClientId(null);
    } catch (e) {
      console.error("Failed to schedule workout", e);
      setError("Failed to schedule workout");
    }
  };

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="spinner-border text-light" role="status" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-center">{error}</div>
      ) : (
        <>
          <motion.div
            className="flex flex-col flex-grow min-h-0 bg-gray-800 text-white rounded-2xl shadow-lg p-6"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h1 className="text-2xl font-bold text-center mb-4">Workout Calendar</h1>
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevMonth} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">‹ Prev</button>
              <div className="text-lg font-medium">
                {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
              </div>
              <button onClick={nextMonth} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">Next ›</button>
            </div>
            <div className="grid grid-cols-7 text-center text-sm font-semibold border-b border-gray-700 pb-1">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-700 flex-grow min-h-0">
              {calendarDays.map((day, idx) => {
                const key = day.toLocaleDateString();
                const isCurrent = day.getMonth() === currentMonth.getMonth();
                const isToday = key === new Date().toLocaleDateString();
                const dayEvents = eventsByDate[key] || [];
                return (
                  <div
                    key={idx}
                    onClick={() => onDayClick(day)}
                    className={`flex flex-col p-2 bg-gray-800 hover:bg-gray-700 cursor-pointer ${
                      !isCurrent ? "opacity-50" : ""
                    } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                    data-date={day.toISOString().split("T")[0]}
                  >
                    <span className="text-sm">{day.getDate()}</span>
                    <div className="mt-1 space-y-1 flex-1 overflow-y-auto">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(ev);
                          }}
                          className={`text-xs truncate rounded px-1 cursor-pointer ${
                            ev.completed
                              ? "bg-green-600 hover:bg-green-500"
                              : "bg-blue-600 hover:bg-blue-500"
                          }`}
                          title={new Date(ev.start).toLocaleString()}
                        >
                          {new Date(ev.start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}- {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Schedule Workout Modal */}
          {showSchedule && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-lg w-96 space-y-4">
                <h2 className="text-xl font-semibold text-white">Schedule Workout</h2>
                {user?.userType === "trainer" && (
                  <>
                    <label className="form-label text-gray-300">Select Client:</label>
                    <select
                      className="form-select bg-gray-700 text-white mb-3 w-full p-2 rounded"
                      value={selectedClientId ?? ""}
                      onChange={(e) => setSelectedClientId(Number(e.target.value))}
                      name="clientSelect"
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
                <label className="form-label text-gray-300">Pick Date &amp; Time:</label>
                <input
                  type="datetime-local"
                  className="form-control bg-gray-700 text-white w-full p-2 rounded mb-3"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                  min={toLocalISOString(new Date())}
                />
                <label className="form-label text-gray-300">Select Workout:</label>
                <select
                  className="form-select bg-gray-700 text-white w-full p-2 rounded mb-3"
                  value={selectedWorkoutId ?? ""}
                  name="workoutSelect"
                  onChange={(e) => setSelectedWorkoutId(Number(e.target.value))}
                >
                  <option value="">-- Select a Workout --</option>
                  {availableWorkouts.map((w) => (
                    <option 
                      key={w.id} 
                      value={w.id}
                      data-id={w.id}
                      >
                      {w.title}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowSchedule(false)}
                    className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={schedule}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white"
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
              <div className="bg-gray-900 p-6 rounded-lg w-80 space-y-4">
                <h2 className="text-xl font-semibold text-white">{selectedEvent.title}</h2>
                <p className="text-gray-300">
                  {selectedEvent.completed ? "Completed session" : "Scheduled workout"}
                </p>
                <p className="text-gray-300">
                  {new Date(selectedEvent.start).toLocaleDateString(undefined, { dateStyle: "medium" })}{" "}
                  {new Date(selectedEvent.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </p>
                {selectedEvent.duration && <p className="text-gray-300">Duration: {selectedEvent.duration}</p>}
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white"
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