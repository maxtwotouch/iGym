import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { fetchScheduledWorkouts } from "~/utils/api/scheduledWorkouts";
import { mapWorkoutSessionsToCalendarEvents } from "~/utils/calendarHelper";
import apiClient from "~/utils/api/apiClient";
import { toLocalISOString } from "~/utils/date";

type CalendarEvent = {
  id: string;
  workout_id: number;
  title: string;
  start: string;
  end?: string;
  duration?: string;
};

export const Calendar = () => {
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availableWorkouts, setAvailableWorkouts] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showSchedule, setShowSchedule] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const sched = await fetchScheduledWorkouts();
        const sess = await mapWorkoutSessionsToCalendarEvents();
        setEvents([...sched, ...sess]);
      } catch (e: any) {
        console.error(e);
        setError("Failed to load calendar");
      }
      setLoading(false);
    })();
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/workout/");
        if (res.status !== 200) throw new Error();
        const data = await res.data;
        setAvailableWorkouts(data.map((w: any) => ({ id: w.id, title: w.name })));
      } catch {
        console.error("Could not load workouts");
      }
    })();
  }, []);

  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

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

  const eventsByDate = useMemo(() => {
    const m: Record<string, CalendarEvent[]> = {};
    events.forEach(ev => {
      const localDate = new Date(ev.start).toLocaleDateString("sv-SE");
      (m[localDate] ||= []).push(ev);
    });
    return m;
  }, [events]);

  const onDayClick = (date: Date) => {
    const isoLocal = toLocalISOString(date);
    setSelectedDateTime(isoLocal);
    setShowSchedule(true);
  };

  const schedule = async () => {
    if (!selectedWorkoutId) return;
    const dt = new Date(selectedDateTime);
    if (dt < new Date()) {
      alert("Can't schedule in the past");
      return;
    }
    try {
      const res = await apiClient.post("/schedule/workout/create/", {
        workout_template: selectedWorkoutId,
        scheduled_date: selectedDateTime,
      });
      if (res.status !== 201) throw new Error();
      const ns = await res.data;
      setEvents(e => [
        ...e,
        {
          id: `scheduled-${ns.id}`,
          workout_id: ns.workout_template,
          title: ns.workout_title,
          start: ns.scheduled_date,
        },
      ]);
      setShowSchedule(false);
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

        <div className="flex items-center justify-between mb-2">
          <button onClick={prevMonth} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">‹ Prev</button>
          <div className="text-lg font-medium">
            {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
          </div>
          <button onClick={nextMonth} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">Next ›</button>
        </div>

        <div className="grid grid-cols-7 text-center text-sm font-semibold border-b border-gray-700 pb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-700 flex-grow min-h-0">
          {calendarDays.map((day, i) => {
            const iso = day.toLocaleDateString("sv-SE");
            const isCur = day.getMonth() === currentMonth.getMonth();
            const todayISO = new Date().toLocaleDateString("sv-SE");
            const isToday = iso === todayISO;
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
      </motion.div>

      {/* Modal to schedule workout */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg w-96 space-y-4 shadow-xl">
            <h2 className="text-xl font-semibold text-white">Schedule Workout</h2>
            <p className="text-gray-300">Date: {new Date(selectedDateTime).toLocaleString()}</p>

            <select
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={selectedWorkoutId ?? ""}
              onChange={e => setSelectedWorkoutId(Number(e.target.value))}
            >
              <option value="">Select a workout</option>
              {availableWorkouts.map(w => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSchedule(false)} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Cancel</button>
              <button onClick={schedule} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};