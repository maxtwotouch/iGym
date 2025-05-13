import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router";
import apiClient from "~/utils/api/apiClient";
import defaultProfilePicture from "~/assets/defaultProfilePicture.jpg";
import { toLocalISOString } from "~/utils/date";

interface Client {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile: {
    profile_picture: string;
    height: number;
    weight: number;
    id: number;
    personal_trainer: number;
    pt_chatroom: number;
  }
}

type SetInfo = { 
  id: string | number; 
  repetitions: number; 
  weight: number; 
};

type ExerciseSessionInfoForClient = { 
  id: string | number; 
  exercise: { name: string; };
  sets: SetInfo[];
};

type CalendarEvent = {
  id: string;
  workout_id: number;
  title: string;
  start: string;
  end?: string;
  duration?: string;
  exercises?: any[];
  exercise_sessions?: ExerciseSessionInfoForClient[];
  calories_burned?: number;
  type: "planned" | "session" | "pt";
};

export default function ClientCalendar() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true); 

  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [viewALlEventsDay, setViewAllEventsDay] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  const onEventClick = (ev: CalendarEvent) => setSelectedEvent(ev);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true); 
      setError("");
      try {
        // 1) Load client info
        const userRes = await apiClient.get(`/user/${id}/`);
        
        if (userRes.status === 200) {
          setClient(userRes.data as Client);
        }

        const clientIdNum = Number(id);
        const now = new Date();

        // 2) Planned workouts
        const schedRes = await apiClient.get<any[]>(`/trainer/client/${id}/scheduled_workouts/`);
        const plannedEvents: CalendarEvent[] = (
          schedRes.data as any[]
        )
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
            exercise_sessions: (session.exercise_sessions || []).map((es: any) => ({
              id: es.id,
              exercise: { name: es.exercise?.name || "Unknown Exercise" },
              sets: (es.sets || []).map((set: any) => ({
                id: set.id,
                repetitions: set.repetitions,
                weight: set.weight,
              })),
            })),
            calories_burned: session.calories_burned,
            type: "session",
          };
        });

        // Combine all events
        setEvents([...plannedEvents, ...ptEvents, ...sessionEvents]);
      } catch (e: any) {
        console.error(e);
        setError(e.response?.data?.detail || e.message || "Failed to load client calendar data");
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
      const key = new Date(ev.start).toLocaleDateString();
      (map[key] ||= []).push(ev);
    });
    return map;
  }, [events]);

  if (isLoading) { 
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Check if client is null or error is not null
  if (!client && !error) { // Must ensure that the client is defined before displaying the calendar
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-lg">Client not found or could not be loaded.</p>
      </div>
    );
  }

  return (
    <motion.div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    {isLoading ? (
      <div className="flex-grow flex items-center justify-center">
        <div className="spinner-border text-light" role="status"/>
      </div>
    ) : error ? (
      <div className="text-red-400 text-center">
        <p>Error loading client calendar: {error}</p>
      </div>
    ) : !client ? ( 
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
            <p className="text-lg">Client data is not available.</p>
        </div>
    ) : (
      <>
        {/* Header Client information */}
        <div className="text-white flex justify-center px-4 py-6">
          <div className="bg-gray-700 max-w-xl flex items-center justify-center p-4 rounded-lg shadow-md gap-x-6">
            <div className="text-left">
              <h1 className="text-xl font-bold text-white">Client: {client.first_name} {client.last_name}</h1>
              <p className="text-sm text-gray-300 mt-1">
                Height: {client.profile.height} cm | Weight: {client.profile.weight} kg
              </p>
            </div>
            <img
              src={client.profile.profile_picture || defaultProfilePicture} 
              alt={`${client.first_name} ${client.last_name}`}
              className="w-16 h-16 rounded-full border-2 border-gray-600 flex-shrink-0"
            />
          </div>
        </div>

        {/* Calendar */}
        <div className="flex flex-col flex-grow min-h-0 bg-gray-800 text-white rounded-2xl shadow-lg p-6 mt-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer">Prev</button>
            <div className="text-white font-semibold">{currentMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
            <button onClick={nextMonth} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer">Next</button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-gray-300 text-sm font-semibold text-center border-b border-gray-700 pb-1">
            { ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="py-2">{d}</div>
            )) }
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-700 flex-grow min-h-0">
            {calendarDays.map((day, i) => {
              const key = day.toLocaleDateString();
              const isCurrent = day.getMonth() === currentMonth.getMonth();
              const isToday = key === new Date().toLocaleDateString();
              const dayEvents = eventsByDate[key] || [];
              return (
                <div
                  key={i}
                  className={
                    `flex flex-col p-2 bg-gray-800 hover:bg-gray-700 cursor-pointer ${!isCurrent ? "opacity-50" : ""} ${isToday ? "ring-2 ring-blue-500" : ""}`
                  }
                >
                  <span className="text-gray-400 text-sm mb-1">{day.getDate()}</span>
                  <div className="flex flex-col space-y-1 flex-1 overflow-y-auto">
                    {dayEvents.slice(0,3).map(ev => (
                      <div
                        key={ev.id}
                        onClick={e => { 
                          e.stopPropagation(); 
                          onEventClick(ev); 
                        }}
                        className={
                          `h-6 rounded text-xs leading-6 px-1 truncate ${ev.type === "session" ? "bg-green-600 hover:bg-green-500" : ev.type === "pt" ? "bg-purple-600 hover:bg-purple-500" : "bg-blue-600 hover:bg-blue-500"}`
                        }
                        title={new Date(ev.start).toLocaleString()}
                      >
                        {new Date(ev.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} – {ev.title}
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
                  undefined, 
                    {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    }
                  )}
                </span>
              </div>
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
}
