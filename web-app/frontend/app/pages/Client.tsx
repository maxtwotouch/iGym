// src/components/ClientCalendar.tsx
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router";
import apiClient from "~/utils/api/apiClient";

interface Client {
  id: number;
  username: string;
}

type CalendarEvent = {
  id: string;
  workout_id: number;
  title: string;
  start: string;
  end?: string;
  duration?: string;
  exercises?: any[];
  exercise_sessions?: any[];
  calories_burned?: number;
  type: "planned" | "session";
};

export default function ClientCalendar() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDetail, setShowDetail] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  // ─── Fetch client + calendar data ─────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        // 1) load client
        const userRes = await apiClient.get<Client>(`/user/${id}/`);
        if (userRes.status === 200) setClient(userRes.data);

        // 2) fetch planned workouts
        const schedRes = await apiClient.get(`/trainer/client/${id}/scheduled_workouts/`);
        const ptSchedRes = await apiClient.get(`/schedule/pt_workout/`);
        const clientIdAsNumber = Number(id); // Convert id to number
        const ptSched = (ptSchedRes.data as any[]).find(w => w.client === clientIdAsNumber);
        if (ptSched) {
          schedRes.data.push({
            id: ptSched.id,
            scheduled_date: ptSched.scheduled_date,
            user: ptSched.client,
            workout_template: ptSched.workout_template,
            workout_title: ptSched.workout_title,
          });
        }
        schedRes.data.sort((a: any, b: any) => {
          const dateA = new Date(a.scheduled_date);
          const dateB = new Date(b.scheduled_date);
          return dateA.getTime() - dateB.getTime();
        });
        const now = new Date();
        const future = (schedRes.data as any[])
          .filter(w => new Date(w.scheduled_date) >= now);

        const scheduledEvents: CalendarEvent[] = await Promise.all(
          future.map(async item => {
            try {
              const exRes = await apiClient.get(`/workout/${item.workout_template}/exercises/`);
              return {
                id: `planned-${item.id}`,
                workout_id: item.workout_template,
                title: item.workout_title,
                start: item.scheduled_date,
                exercises: exRes.data,
                type: "planned",
              };
            } catch {
              return {
                id: `planned-${item.id}`,
                workout_id: item.workout_template,
                title: item.workout_title,
                start: item.scheduled_date,
                exercises: [],
                type: "planned",
              };
            }
          })
        );

        // 3) fetch past sessions
        const [wkRes, sesRes] = await Promise.all([
          apiClient.get(`/trainer/client/${id}/workouts/`),
          apiClient.get(`/trainer/client/${id}/workout_sessions/`)
        ]);
        const workoutMap = new Map<number, string>(
          (wkRes.data as any[]).map(w => [w.id, w.name])
        );

        const sessionEvents: CalendarEvent[] = await Promise.all(
          (sesRes.data as any[]).map(async session => {
            const startTime = new Date(session.start_time);
            const [h, m, s] = (session.duration || "00:00:00")
              .split(":").map(Number);
            const endTime = new Date(
              startTime.getTime() + (h * 3600 + m * 60 + s) * 1000
            );
            let exercises: any[] = [];
            try {
              const exRes = await apiClient.get(`/workout/${session.workout}/exercises/`);
              exercises = exRes.data;
            } catch {}
            return {
              id: `session-${session.id}`,
              workout_id: session.workout,
              title: workoutMap.get(session.workout) ?? "Workout Session",
              start: startTime.toISOString(),
              end: endTime.toISOString(),
              duration: session.duration,
              exercises,
              exercise_sessions: session.exercise_sessions,
              calories_burned: session.calories_burned,
              type: "session",
            };
          })
        );

        setEvents([...scheduledEvents, ...sessionEvents]);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load calendar");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  // ─── Month state & navigation ────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const prevMonth = () =>
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  // ─── Build 42-day grid for the month ─────────────────────────────────────
  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear();
    const mon = currentMonth.getMonth();
    const first = new Date(y, mon, 1);
    const startDow = first.getDay();
    const dim = new Date(y, mon + 1, 0).getDate();
    const prevDim = new Date(y, mon, 0).getDate();
    const cells: Date[] = [];
    for (let i = startDow - 1; i >= 0; i--) {
      cells.push(new Date(y, mon - 1, prevDim - i));
    }
    for (let d = 1; d <= dim; d++) {
      cells.push(new Date(y, mon, d));
    }
    let nxt = 1;
    while (cells.length < 42) {
      cells.push(new Date(y, mon + 1, nxt++));
    }
    return cells;
  }, [currentMonth]);

  // ─── Group events by date string ─────────────────────────────────────────
  const eventsByDate = useMemo(() => {
    const m: Record<string, CalendarEvent[]> = {};
    events.forEach(ev => {
      const key = new Date(ev.start).toLocaleDateString("en-US");
      (m[key] ||= []).push(ev);
    });
    return m;
  }, [events]);

  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading client…
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col h-screen bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="bg-gray-800 text-white text-center py-2">
        <span className="text-lg font-semibold">{client.username}</span>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <button
          onClick={prevMonth}
          className="text-white px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          ‹ Prev
        </button>
        <div className="text-white font-semibold">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric"
          })}
        </div>
        <button
          onClick={nextMonth}
          className="text-white px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          Next ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-gray-800 text-gray-300 text-sm font-semibold text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="py-2 border-b border-gray-700">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto bg-gray-800">
        <div className="grid grid-cols-7 gap-px bg-gray-700 h-full">
          {calendarDays.map((day, i) => {
            const key = day.toLocaleDateString("en-US");
            const isCurr = day.getMonth() === currentMonth.getMonth();
            const isToday = key === new Date().toLocaleDateString("en-US");
            const dayEvents = eventsByDate[key] || [];

            return (
              <div
                key={i}
                onClick={() => {}}
                className={`
                  flex flex-col p-2 bg-gray-800 hover:bg-gray-700 cursor-pointer
                  ${!isCurr ? "opacity-50" : ""} ${isToday ? "ring-2 ring-blue-500" : ""}
                `}
              >
                <div className="text-gray-400 text-sm mb-1">{day.getDate()}</div>
                <div className="flex flex-col space-y-1 flex-1 overflow-y-auto">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      onClick={e => {
                        e.stopPropagation();
                        setDetailEvent(ev);
                        setShowDetail(true);
                      }}
                      className={`
                        h-6 rounded text-white text-xs leading-6 px-1 truncate
                        ${ev.type === "session"
                          ? "bg-green-600 hover:bg-green-500"
                          : "bg-blue-600 hover:bg-blue-500"}
                      `}
                      title={new Date(ev.start).toLocaleString("en-US")}
                    >
                      {new Date(ev.start).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}{" "}
                      – {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-gray-500 text-xs">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full" />
        </div>
      )}

      {/* Detail modal */}
      {showDetail && detailEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <motion.div
            className="bg-gray-800 text-white rounded-lg shadow-lg p-6 max-w-md w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{detailEvent.title}</h2>
              <button
                className="text-white text-2xl"
                onClick={() => setShowDetail(false)}
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              <p>
                <strong>Type:</strong>{" "}
                {detailEvent.type === "session"
                  ? "Completed Session"
                  : "Planned Workout"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(detailEvent.start).toLocaleDateString("en-US")}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {new Date(detailEvent.start).toLocaleTimeString("en-US")}
                {detailEvent.end
                  ? ` – ${new Date(detailEvent.end).toLocaleTimeString("en-US")}`
                  : ""}
              </p>
              {detailEvent.duration && (
                <p>
                  <strong>Duration:</strong> {detailEvent.duration}
                </p>
              )}
              {detailEvent.calories_burned != null && (
                <p>
                  <strong>Calories:</strong> {detailEvent.calories_burned}
                </p>
              )}
              {detailEvent.exercises?.length ? (
                <>
                <strong>Exercises:</strong>
                <ul className="list-disc pl-5">
                    {detailEvent.exercises.map((exercise: any) => (
                        <li key={exercise.id}>
                            {exercise.name}
                            {detailEvent.exercise_sessions && detailEvent.exercise_sessions.length > 0 && (
                                (() => {
                                    const exercise_session = detailEvent.exercise_sessions.find(
                                        (ex: any) => ex.exercise === exercise.id
                                    );
                                    return exercise_session ? (
                                        <ul className="list-disc pl-5">
                                            {exercise_session.sets.map((set: any, index: number) => (
                                                <li key={index}>
                                                    Set: {index + 1}: Reps: {set.repetitions}, Weight: {set.weight} kg
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null;
                                })()
                            )}
                        </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>No exercises.</p>
              )}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                name="closeButton"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}