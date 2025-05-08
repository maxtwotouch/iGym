import React, { useEffect, useState, useMemo } from "react";
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
  type: "planned" | "session" | "pt";
};

export default function ClientCalendar() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDetail, setShowDetail] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        // 1) Load client info
        const userRes = await apiClient.get<Client>(`/user/${id}/`);
        if (userRes.status === 200) setClient(userRes.data);

        const clientIdNum = Number(id);
        const now = new Date();

        // 2) Planned workouts
        const schedRes = await apiClient.get<any[]>(`/trainer/client/${id}/scheduled_workouts/`);
        const plannedEvents: CalendarEvent[] = (
          schedRes.data as any[]
        )
          .filter(w => new Date(w.scheduled_date) >= now)
          .map(w => ({
            id: `planned-${w.id}`,
            workout_id: w.workout_template,
            title: w.workout_title,
            start: w.scheduled_date,
            type: "planned",
          }));

        // 3) PT 1-on-1 sessions for this client (visible to trainer and client)
        const ptRes = await apiClient.get<any[]>(`/schedule/pt_workout/`);
        const ptEvents: CalendarEvent[] = (
          ptRes.data as any[]
        )
          .filter(session => session.client === clientIdNum)
          .map(session => ({
            id: `pt-${session.id}`,
            workout_id: session.workout_template,
            title: `${session.workout_title} with ${session.trainer_username || 'Trainer'}`,
            start: session.scheduled_date,
            type: "pt",
          }));

        // 4) Past workout sessions
        const [wkRes, sesRes] = await Promise.all([
          apiClient.get(`/trainer/client/${id}/workouts/`),
          apiClient.get(`/trainer/client/${id}/workout_sessions/`),
        ]);
        const workoutMap = new Map<number, string>(
          (wkRes.data as any[]).map(w => [w.id, w.name])
        );
        const sessionEvents: CalendarEvent[] = (sesRes.data as any[]).map(session => {
          const start = new Date(session.start_time);
          const [h, m, s] = (session.duration || "00:00:00").split(":").map(Number);
          const end = new Date(start.getTime() + (h * 3600 + m * 60 + s) * 1000);
          return {
            id: `session-${session.id}`,
            workout_id: session.workout,
            title: workoutMap.get(session.workout) || "Workout Session",
            start: start.toISOString(),
            end: end.toISOString(),
            duration: session.duration,
            exercises: (session.exercise_sessions || []).map((es: any) => es.exercise),
            exercise_sessions: session.exercise_sessions,
            calories_burned: session.calories_burned,
            type: "session",
          };
        });

        // Combine all events
        setEvents([...plannedEvents, ...ptEvents, ...sessionEvents]);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load calendar");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const first = new Date(y, m, 1);
    const startDow = first.getDay();
    const dim = new Date(y, m + 1, 0).getDate();
    const prevDim = new Date(y, m, 0).getDate();
    const days: Date[] = [];
    for (let i = startDow - 1; i >= 0; i--) days.push(new Date(y, m - 1, prevDim - i));
    for (let d = 1; d <= dim; d++) days.push(new Date(y, m, d));
    let nxt = 1;
    while (days.length < 42) days.push(new Date(y, m + 1, nxt++));
    return days;
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(ev => {
      const key = new Date(ev.start).toLocaleDateString("en-US");
      (map[key] ||= []).push(ev);
    });
    return map;
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
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="bg-gray-800 text-white text-center py-2">
        <span className="text-lg font-semibold">{client.username}</span>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <button onClick={prevMonth} className="text-white px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">‹ Prev</button>
        <div className="text-white font-semibold">{currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}</div>
        <button onClick={nextMonth} className="text-white px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">Next ›</button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-gray-800 text-gray-300 text-sm font-semibold text-center">
        { ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="py-2 border-b border-gray-700">{d}</div>
        )) }
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
                className={
                  `flex flex-col p-2 bg-gray-800 hover:bg-gray-700 cursor-pointer ${!isCurr ? "opacity-50" : ""} ${isToday ? "ring-2 ring-blue-500" : ""}`
                }
              >
                <div className="text-gray-400 text-sm mb-1">{day.getDate()}</div>
                <div className="flex flex-col space-y-1 flex-1 overflow-y-auto">
                  {dayEvents.slice(0,3).map(ev => (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); setDetailEvent(ev); setShowDetail(true); }}
                      className={
                        `h-6 rounded text-white text-xs leading-6 px-1 truncate ${ev.type === "session" ? "bg-green-600 hover:bg-green-500" : ev.type === "pt" ? "bg-purple-600 hover:bg-purple-500" : "bg-blue-600 hover:bg-blue-500"}`
                      }
                      title={new Date(ev.start).toLocaleString("en-US")}
                    >
                      {new Date(ev.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} – {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-gray-500 text-xs">+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full" />
        </div>
      )}

      {/* Detail modal */}
      {showDetail && detailEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <motion.div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 max-w-md w-full" initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.3}}>
            {/* Header */}
            <div className="flex justify-between items-baseline mb-4">
              <h2 className="text-xl font-semibold">{detailEvent.title}</h2>
              <div className="text-sm text-gray-400">
                <div>
                  {new Date(detailEvent.start).toLocaleDateString("en-GB",{weekday:"short",year:"numeric",month:"short",day:"2-digit"})}
                </div>
                <div>
                  {new Date(detailEvent.start).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
                  {detailEvent.end && ` – ${new Date(detailEvent.end).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`}
                </div>
              </div>
            </div>
            {/* Type */}
            <p className="text-sm mb-2"
                   style={{ color:
                    detailEvent.type === "session" ? "#4ade80" /*green*/ :
                     detailEvent.type === "pt"      ? "#c084fc" /*purple*/ :
                     "#93c5fd" /*blue*/ }}>
                      {detailEvent.type === "session"
                      ? "✅ Completed Session"
                      : detailEvent.type === "pt"
                      ? "🤝 1-on-1 Session"
                      : "🗓️ Planned Workout"}
                      </p>
            {/* Calories & duration */}
            {detailEvent.calories_burned != null && (
              <p className="text-sm text-gray-300">🔥 Calories: <span className="font-semibold text-white">{Math.round(detailEvent.calories_burned)}</span></p>
            )}
            {detailEvent.duration && (
              <p className="text-sm text-gray-300">⏱ Duration: <span className="font-semibold text-white">{detailEvent.duration}</span></p>
            )}
                {/* Exercises & Sets */}
                {detailEvent.exercise_sessions && detailEvent.exercise_sessions.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {detailEvent.exercise_sessions.map((es: { id: string; exercise: { name: string }; sets: { id: string; repetitions: number; weight: number }[] }) => (
                      <div key={es.id}>
                        <p className="text-white font-semibold">
                          {es.exercise.name}
                        </p>
                        <div className="ml-4 text-sm text-gray-400 space-y-1">
                          {es.sets.map((st: { id: string; repetitions: number; weight: number }, idx: number) => (
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
            {/* Close */}
            <div className="mt-6 text-right">
              <button onClick={() => setShowDetail(false)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
