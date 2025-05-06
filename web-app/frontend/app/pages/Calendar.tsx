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
  completed: boolean;
};

function getOffsetSuffix(): string {
  const offset = new Date().getTimezoneOffset();
  const abs = Math.abs(offset);
  const sign = offset > 0 ? "-" : "+";
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

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
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 1) fetch scheduled workouts (future)
        const sched = await fetchScheduledWorkouts();
        const scheduledEvents: CalendarEvent[] = sched.map(ev => ({
          ...ev,
          completed: false,      // mark all scheduled as not completed
        }));

        // 2) fetch sessions via your helper (unchanged); then decorate
        const rawSessions = await mapWorkoutSessionsToCalendarEvents();
        const sessionEvents: CalendarEvent[] = rawSessions.map(ev => ({
          ...ev,
          // if there's an end time before now → completed
          completed: ev.end ? new Date(ev.end) < new Date() : false,
        }));

        setEvents([...scheduledEvents, ...sessionEvents]);
      } catch (e: any) {
        console.error(e);
        setError("Failed to load calendar");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/workout/");
        if (res.status !== 200) throw new Error();
        setAvailableWorkouts(
          res.data.map((w: any) => ({ id: w.id, title: w.name }))
        );
      } catch {
        console.error("Could not load workouts");
      }
    })();
  }, []);

  const prevMonth = () =>
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const total = 42;
    const days: Date[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevDays - i));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    let nxt = 1;
    while (days.length < total) {
      days.push(new Date(year, month + 1, nxt++));
    }
    return days;
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const m: Record<string, CalendarEvent[]> = {};
    events.forEach(ev => {
      const key = new Date(ev.start).toLocaleDateString("en-US");
      (m[key] ||= []).push(ev);
    });
    return m;
  }, [events]);

  const onDayClick = (date: Date) => {
    date.setHours(12, 0, 0, 0);
    setSelectedDateTime(toLocalISOString(date));
    setShowSchedule(true);
  };

  const onEventClick = (ev: CalendarEvent) => {
    setSelectedEvent(ev);
  };

  const schedule = async () => {
    if (!selectedWorkoutId || !selectedDateTime) return;

    const datetimeWithOffset = selectedDateTime + getOffsetSuffix();
    const now = new Date();
    const [datePart, timePart] = selectedDateTime.split("T");
    const [y, mo, d] = datePart.split("-").map(Number);
    const [h, mi] = timePart.split(":").map(Number);
    const dt = new Date(y, mo - 1, d, h, mi);

    if (dt < now) {
      alert("Can't schedule in the past");
      return;
    }

    try {
      const res = await apiClient.post("/schedule/workout/create/", {
        workout_template: selectedWorkoutId,
        scheduled_date: datetimeWithOffset,
      });
      if (res.status !== 201) throw new Error();

      const ns = res.data;
      setEvents(e => [
        ...e,
        {
          id: `scheduled-${ns.id}`,
          workout_id: ns.workout_template,
          title: ns.workout_title,
          start: ns.scheduled_date,
          completed: false,
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
      {/* Main Calendar */}
      <motion.div
        className="flex flex-col flex-grow min-h-0 bg-gray-800 text-white rounded-2xl shadow-lg p-6"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-center mb-4">Workout Calendar</h1>

        {/* Month Nav */}
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

        {/* Weekdays */}
        <div className="grid grid-cols-7 text-center text-sm font-semibold border-b border-gray-700 pb-1">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-700 flex-grow min-h-0">
          {calendarDays.map((day, i) => {
            const iso = day.toLocaleDateString("en-US");
            const isCurrent = day.getMonth() === currentMonth.getMonth();
            const isToday = iso === new Date().toLocaleDateString("en-US");
            const dayEvents = eventsByDate[iso] || [];

            return (
              <div
                key={i}
                onClick={() => onDayClick(day)}
                className={`
                  flex flex-col p-2 bg-gray-800 hover:bg-gray-700 cursor-pointer
                  ${!isCurrent ? "opacity-50" : ""} ${isToday ? "ring-2 ring-blue-500" : ""}
                `}
              >
                <span className="text-sm">{day.getDate()}</span>
                <div className="mt-1 space-y-1 flex-1 overflow-y-auto">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                      className={`
                        text-xs truncate rounded px-1 cursor-pointer
                        ${ev.completed
                          ? "bg-green-600 hover:bg-green-500"
                          : "bg-blue-600 hover:bg-blue-500"
                        }
                      `}
                      title={new Date(ev.start).toLocaleString()}
                    >
                      {new Date(ev.start).toLocaleTimeString("en-US", {
                        hour: "2-digit", minute: "2-digit"
                      })} – {ev.title}
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

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg w-96 space-y-4 shadow-xl">
            <h2 className="text-xl font-semibold text-white">Schedule Workout</h2>
            <input
              type="datetime-local"
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={selectedDateTime}
              onChange={e => setSelectedDateTime(e.target.value)}
            />
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
              <button
                onClick={() => setShowSchedule(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white"
              >
                Cancel
              </button>
              <button
                onClick={schedule}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg w-80 space-y-4 shadow-xl">
            <h2 className="text-xl font-semibold text-white">{selectedEvent.title}</h2>
            <p className="text-gray-300">
              {selectedEvent.completed ? "Completed session" : "Scheduled workout"}
            </p>
            <p className="text-gray-300">
              {new Date(selectedEvent.start).toLocaleDateString("en-US", { dateStyle: "medium" })}{" "}
              {new Date(selectedEvent.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
            {selectedEvent.duration && (
              <p className="text-gray-300">Duration: {selectedEvent.duration}</p>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};