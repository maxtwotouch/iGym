import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { fetchScheduledWorkouts } from "~/utils/api/scheduledWorkouts";
import { mapWorkoutSessionsToCalendarEvents } from "~/utils/calendarHelper";
import apiClient from "~/utils/api/apiClient";

type CalendarEvent = {
  id: string;
  workout_id: number;
  title: string;
  start: string;    // ISO string
  end?: string;
  duration?: string;
};

export const Calendar = () => {
  const navigate = useNavigate();

  // state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availableWorkouts, setAvailableWorkouts] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modals
  const [showSchedule, setShowSchedule] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  // load events once
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return navigate("/login");
    (async () => {
      setLoading(true);
      try {
        const sched = await fetchScheduledWorkouts(token);
        const sess = await mapWorkoutSessionsToCalendarEvents(token);
        setEvents([...sched, ...sess]);
      } catch (e: any) {
        console.error(e);
        setError("Failed to load calendar");
      }
      setLoading(false);
    })();
  }, [navigate]);

  // load workout templates
  useEffect(() => {
    const fetchAvailableWorkouts = async () => {
      try {
        const response = await apiClient.get("/workout/");
        
        if (response.status !== 200) {
          throw new Error("Failed to fetch available workouts");
        }

        const data = await response.data;

        setAvailableWorkouts(
          data.map((w: any) => ({
            id: w.id,
            title: w.name
          }))
        );
      } catch (err: any) {
        console.error(err);
      }
    })();
  }, []);

  // month nav
  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  // build 6×7 grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const total = 42;
    const days: Date[] = [];
    for (let i = startDow - 1; i >= 0; i--) days.push(new Date(year, month - 1, prevDays - i));
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    let nxt = 1;
    while (days.length < total) days.push(new Date(year, month + 1, nxt++));
    return days;
  }, [currentMonth]);

  // group events
  const eventsByDate = useMemo(() => {
    const m: Record<string, CalendarEvent[]> = {};
    events.forEach(ev => {
      const key = ev.start.slice(0, 10);
      (m[key] ||= []).push(ev);
    });
    return m;
  }, [events]);

  const onDayClick = (date: Date) => {
    const isoLocal = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setSelectedDateTime(localDateTime);

    if (userType === "trainer") {
      setShowPtScheduleModal(true); // pt
    } else {
      setShowScheduleModal(true); // client
    }
  };

  // POST to schedule a workout
  const handleScheduleWorkout = async () => {
    if (!selectedWorkoutId || !selectedDateTime) return;

    // Convert local date/time from input to full ISO string
    const fullDate = new Date(selectedDateTime);
    const isoDateTime = fullDate.toISOString();

    // Check if the selected date is in the past
    const now = new Date();
    if (fullDate < now) {
      alert("You cannot schedule a workout in the past."); // Set error message
      return;
    }
    try {
      const response = await fetch(`${backendUrl}/schedule/workout/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error("Failed to schedule workout");
      }
      const newSession = await response.json();

      const newEvent = {
        id: `scheduled-${newSession.id}`,
        workout_id: newSession.workout_template,
        title: newSession.workout_title,
        start: newSession.scheduled_date,
      };

      setCalendarEvents((prev) => [...prev, newEvent]);

      // Reset modal state
      setShowScheduleModal(false);
      setSelectedWorkoutId(null);
      setSelectedDateTime("");
    } catch (e: any) {
      console.error(e);
      setError("Failed to schedule");
    }
  };

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col flex-grow min-h-0 bg-gray-800 text-white rounded-2xl shadow-lg p-6"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-center mb-4">Workout Calendar</h1>

        {/* navigation */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={prevMonth} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">
            ‹ Prev
          </button>
          <div className="text-lg font-medium">
            {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
          </div>
          <button onClick={nextMonth} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">
            Next ›
          </button>
        </div>

        {/* weekdays */}
        <div className="grid grid-cols-7 text-center text-sm font-semibold border-b border-gray-700 pb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-700 flex-grow min-h-0">
          {calendarDays.map((day, i) => {
            const iso = day.toISOString().slice(0, 10);
            const isCur = day.getMonth() === currentMonth.getMonth();
            const isToday = iso === new Date().toISOString().slice(0, 10);
            const dayEvents = eventsByDate[iso] || [];

            return (
              <div
                key={i}
                onClick={() => onDayClick(day)}
                className={`
                  flex flex-col p-2 bg-gray-800 hover:bg-gray-700 cursor-pointer
                  ${!isCur ? "opacity-50" : ""} ${isToday ? "ring-2 ring-blue-500" : ""}
                `}
              >
                <div className="flex justify-between">
                  <span className="text-sm">{day.getDate()}</span>
                </div>
                <div className="mt-1 space-y-1 flex-1 overflow-y-auto">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      onClick={e => {
                        e.stopPropagation();
                        setDetailEvent(ev);
                        setShowDetail(true);
                      }}
                      className="text-xs truncate bg-blue-600 rounded px-1"
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-400">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Schedule Modal */}
        {showSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center border-b border-gray-700 px-4 py-2">
                <h2 className="font-semibold">Schedule Workout</h2>
                <button onClick={() => setShowSchedule(false)} className="text-xl">
                  ×
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm mb-1">Workout Template</label>
                  <select
                    className="w-full bg-gray-700 px-3 py-2 rounded focus:outline-none"
                    value={selectedWorkoutId ?? ""}
                    onChange={e => setSelectedWorkoutId(Number(e.target.value))}                >
                    <option value="">— select —</option>
                    {availableWorkouts.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-gray-700 px-3 py-2 rounded focus:outline-none"
                    value={selectedDateTime}
                    onChange={e => setSelectedDateTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 border-t border-gray-700 px-4 py-2">
                <button
                  onClick={() => setShowSchedule(false)}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={schedule}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetail && detailEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center border-b border-gray-700 px-4 py-2">
                <h2 className="font-semibold">{detailEvent.title}</h2>
                <button onClick={() => setShowDetail(false)} className="text-xl">
                  ×
                </button>
              </div>
              <div className="p-4 space-y-2">
                <p>
                  <strong>Date:</strong> {new Date(detailEvent.start).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {new Date(detailEvent.start).toLocaleTimeString()}
                </p>
                {detailEvent.duration && (
                  <p>
                    <strong>Duration:</strong> {detailEvent.duration}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2 border-t border-gray-700 px-4 py-2">
                <button
                  onClick={() => setShowDetail(false)}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={() => navigate(`/workouts/update/${detailEvent.workout_id}`)}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};