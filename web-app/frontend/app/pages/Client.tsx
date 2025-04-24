
import { backendUrl } from "~/config";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface Client {
    id: number,
    username: string,
}


function Client() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
  
    // For modals & scheduling
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedDateTime, setSelectedDateTime] = useState<string>("");
    const [client, setClient] = useState<Client | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }
        const fetchScheduledWorkouts = async () => {
            try {
                const response = await fetch(`${backendUrl}/trainer/client/${id}/scheduled_workouts/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
        
                if (!response.ok) {
                    throw new Error("Failed to fetch client's scheduled workouts");
                }
        
                const data = await response.json();
                const now = new Date();
                
                // Filter out scheduled workouts in the past
                const futureWorkouts = data.filter((item: any) => new Date(item.scheduled_date) >= now);
                
                // Wait for all  exercise requests to be sent
                const scheduledWorkouts = await Promise.all(
                    futureWorkouts.map(async (item: any) => {
                        try {
                            const exercisesResponse = await fetch(`${backendUrl}/workout/${item.workout_template}/exercises/`, { 
                                headers: { Authorization: `Bearer ${token}` }
                            });
        
                            if (!exercisesResponse.ok) {
                                console.error("Failed to fetch exercises from workout");
                                return {
                                    id: `scheduled-${item.id}`,
                                    workout_id: item.workout_template,
                                    title: item.workout_title,
                                    start: item.scheduled_date,
                                    exercises: []
                                };
                            }
        
                            const exercises = await exercisesResponse.json();
        
                            return {
                                id: `scheduled-${item.id}`,
                                workout_id: item.workout_template,
                                title: item.workout_title,
                                start: item.scheduled_date,
                                exercises: exercises
                            };
                        } catch (error) {
                            console.error("Error:", error);
                            return {
                                id: `scheduled-${item.id}`,
                                workout_id: item.workout_template,
                                title: item.workout_title,
                                start: item.scheduled_date,
                                exercises: []
                            };
                        }
                    })
                );
                return scheduledWorkouts; 
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load client's scheduled workouts");
                return [];
            }
        };
        

        const fetchClientDetails = async () => {
            // Fetch information about the client
            try {
                const response = await fetch(`${backendUrl}/user/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if(!response.ok) {
                    console.error("Failed to fetch client details");
                    return;
                }

                const data = await response.json();
                setClient(data);
            } catch (error) {
                console.error("Error fetching client details:", error);
            }
        };

        const fetchClientWorkoutSessions = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
              navigate("/login");
              return [];
            }

            try {
                // Fetch both  the client's workouts and workout sessions in parallel
                const [workoutsRes, sessionsRes] = await Promise.all([
                  fetch(`${backendUrl}/trainer/client/${id}/workouts/`, { headers: { Authorization: `Bearer ${token}` } }),
                  fetch(`${backendUrl}/trainer/client/${id}/workout_sessions/`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                // Convert responses to JSON
                const [workouts, workoutSessions] = await Promise.all([
                    workoutsRes.json(),
                    sessionsRes.json(),
                ]);

                // Map workout ID to its name for quick lookup
                const workoutMap = new Map(workouts.map((workout: any) => [workout.id, workout.name]));

                // Map workout sessions to calendar events
                const sessionEvents = await Promise.all(workoutSessions.map(async(session: any) => {
                    const startTime = new Date(session.start_time);
                    let durationMs;
                    if (!session.duration) {
                    durationMs = 0; // Return 0 milliseconds for invalid duration
                    }
                
                    else {
                        const parts = session.duration.split(":");
            
                        // Parse hours, minutes, and seconds
                        const hours = parseInt(parts[0], 10) || 0; // Default to 0 if NaN
                        const minutes = parseInt(parts[1], 10) || 0; // Default to 0 if NaN
                        const seconds = parseInt(parts[2], 10) || 0; // Default to 0 if NaN
            
                        durationMs = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
                    }
                    
                    // Calculate end time
                    const endTime = new Date(startTime.getTime() + durationMs);
                    
                    // Fetch the exercises contained in the workout
                    const exercisesResponse = await fetch(`${backendUrl}/workout/${session.workout}/exercises/`, { headers: { Authorization: `Bearer ${token}` } });
                    const exercises = await exercisesResponse.json();

                    if(!exercises) {
                        console.log("Failed to fetch exercises from workout");
                    }
                
                    return {
                        id: `session-${session.id}`,
                        workout_id: session.workout,
                        title: workoutMap.get(session.workout) || "Workout Session",
                        start: startTime.toISOString(),
                        end: endTime.toISOString(),
                        duration: session.duration,
                        exercises: exercises,
                        exercise_sessions: session.exercise_sessions,
                        calories_burned: session.calories_burned,
                    };
                    }));
                
                    return sessionEvents;
                } catch (error) {
                    console.error("Error fetching data:", error);
                    return [];
                }    
        };

        const loadEvents = async () => {
            setIsLoading(true);
            const scheduledEvents = await fetchScheduledWorkouts();
            const sessionEvents = await fetchClientWorkoutSessions();

            setCalendarEvents([...scheduledEvents, ...sessionEvents])
            setIsLoading(false);
        };

        fetchClientDetails();
        loadEvents();
    }, [navigate, id]);

    // When user clicks a date on the calendar
    const handleDateClick = (arg: any) => {
        const dateObj = arg.date;
        // Convert to local "YYYY-MM-DDTHH:MM" format for the datetime-local input
        const localDateTime = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
        setSelectedDateTime(localDateTime);
        setShowScheduleModal(true);
    };

    // Show event details when clicked
    const handleEventClick = (info: any) => {
        const event = calendarEvents.find((w) => w.id.toString() === info.event.id);
        if (event) {
        setSelectedEvent(event);
        setShowModal(true);
        }
    };

    if (!client){
        return <p>Loading client information...</p>;
    }

    return (
        <motion.div className="d-flex flex-column min-vh-100">
            <motion.div
                className="flex-grow bg-gradient-to-br from-gray-900 to-gray-800 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="container bg-dark text-white rounded-lg shadow p-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h1 className="text-center mb-4">Client: {client.username}</h1>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="calendar-container bg-dark text-white">
                        {isLoading ? (
                            <div className="d-flex justify-content-center p-5">
                                <div className="spinner-border text-light" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                    left: "prev,next today",
                                    center: "title",
                                     right: "dayGridMonth,timeGridWeek,timeGridDay"
                                }}
                                events={calendarEvents}
                                eventClick={handleEventClick}
                                dateClick={handleDateClick}
                                height="auto"
                             />
                        )}
                    </div>

                    {/* Event details modal */}
                    {showModal && selectedEvent && (
                    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content bg-dark text-white">
                                <div className="modal-header">
                                    <h5 className="modal-title">Name: {selectedEvent.title}</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <p>
                                        <strong>Date:</strong> {new Date(selectedEvent.start).toLocaleDateString()}
                                    </p>
                                    <p>
                                        <strong>Time:</strong> {new Date(selectedEvent.start).toLocaleTimeString()}
                                        {selectedEvent.end && !isNaN(new Date(selectedEvent.end).getTime()) ? ` - ${new Date(selectedEvent.end).toLocaleTimeString()}` : ""}
                                    </p>

                                    {selectedEvent.duration && (
                                        <p>
                                            <strong>Duration:</strong> {selectedEvent.duration}
                                        </p>
                                    )}
                                    {selectedEvent.calories_burned != null && (
                                        <p>
                                            <strong>Calories Burned:</strong> {selectedEvent.calories_burned}
                                        </p>
                                    )}
                                    {selectedEvent.exercises && selectedEvent.exercises.length > 0 ? (
                                        <div>
                                            <strong>Exercises:</strong>
                                            <ul className="list-disc pl-5">
                                                {selectedEvent.exercises.map((exercise: any) => (
                                                    <li key={exercise.id}>
                                                        {exercise.name}
                                                        {selectedEvent.exercise_sessions && selectedEvent.exercise_sessions.length > 0 && (
                                                            (() => {
                                                                const exercise_session = selectedEvent.exercise_sessions.find(
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
                                        </div>
                                    ) : (
                                        <p>No exercises found for this workout.</p>
                                    )}



                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            onClick={() => setShowModal(false)}
                                            name="closeButton"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
    
};

export default Client;