import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

export default function Calendar() {
  const navigate = useNavigate();

  // Store calendar events (both scheduled workouts and workout sessions)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [availableWorkouts, setAvailableWorkouts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // For modals & scheduling
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");

  // Fetch both scheduled workouts and workout sessions
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch scheduled workouts (for future appointments)
    const fetchScheduledWorkouts = async () => {
      try {
        const response = await fetch(`${backendUrl}/scheduled_workouts/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch scheduled workouts");
        }
        const data = await response.json();
        return data.map((item: any) => ({
          id: `scheduled-${item.id}`,
          title: item.workout_title,
          start: item.scheduled_date,
          // Here we assume a default duration of 1 hour for scheduled workouts
          end: new Date(new Date(item.scheduled_date).getTime() + 60 * 60 * 1000).toISOString()
        }));
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load scheduled workouts");
        return [];
      }
    };

    // Fetch workout sessions (actual sessions with start times)
    const fetchWorkoutSessions = async () => {
      try {
        const response = await fetch(`${backendUrl}/workouts_sessions/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch workout sessions");
        }
        const data = await response.json();
        return data.map((session: any) => ({
          id: `session-${session.id}`,
          // Use the workout name if available; otherwise, a generic title
          title: session.workout?.name || "Workout Session",
          start: session.start_time,
          // Default session duration: 1 hour (adjust if you have a duration field)
          end: new Date(new Date(session.start_time).getTime() + 60 * 60 * 1000).toISOString()
        }));
      } catch (err: any) {
        console.error(err);
        // Optionally set an error for sessions if needed
        return [];
      }
    };

    const loadEvents = async () => {
      setIsLoading(true);
      const scheduledEvents = await fetchScheduledWorkouts();
      const sessionEvents = await fetchWorkoutSessions();
      // Merge both arrays into one event list
      setCalendarEvents([...scheduledEvents, ...sessionEvents]);
      setIsLoading(false);
    };

    loadEvents();
  }, [navigate]);

  // Load available workout templates for scheduling
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const fetchAvailableWorkouts = async () => {
      try {
        const response = await fetch(`${backendUrl}/workouts/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch available workouts");
        }
        const data = await response.json();
        setAvailableWorkouts(
          data.map((w: any) => ({
            id: w.id,
            title: w.name
          }))
        );
      } catch (err: any) {
        console.error(err);
      }
    };

    fetchAvailableWorkouts();
  }, []);

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

  // POST to schedule a workout
  const handleScheduleWorkout = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token || !selectedWorkoutId || !selectedDateTime) return;

    // Convert local date/time from input to full ISO string
    const fullDate = new Date(selectedDateTime);
    const isoDateTime = fullDate.toISOString();

    const postData = {
      workout_template: selectedWorkoutId,
      scheduled_date: isoDateTime
    };

    try {
      const response = await fetch(`${backendUrl}/scheduled_workout/create/`, {
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
        title: newSession.workout_title,
        start: newSession.scheduled_date,
        end: new Date(new Date(newSession.scheduled_date).getTime() + 60 * 60 * 1000).toISOString()
      };

      setCalendarEvents((prev) => [...prev, newEvent]);

      // Reset modal state
      setShowScheduleModal(false);
      setSelectedWorkoutId(null);
      setSelectedDateTime("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to schedule workout");
    }
  };

  // Show event details when clicked
  const handleEventClick = (info: any) => {
    const event = calendarEvents.find((w) => w.id.toString() === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setShowModal(true);
    }
  };

  return (
    <motion.div className="d-flex flex-column min-vh-100">
      <NavBar />
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
          <h1 className="text-center mb-4">Workout Calendar</h1>
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
                    <h5 className="modal-title">{selectedEvent.title}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      <strong>Date:</strong> {new Date(selectedEvent.start).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Time:</strong> {new Date(selectedEvent.start).toLocaleTimeString()} -{" "}
                      {new Date(selectedEvent.end).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate(`/workouts/update/${selectedEvent.id.split("-")[1]}`)}
                    >
                      View Workout Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule a new workout modal */}
          {showScheduleModal && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content bg-dark text-white">
                  <div className="modal-header">
                    <h5 className="modal-title">Schedule Workout</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowScheduleModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <label htmlFor="workoutSelect" className="form-label">
                      Select a Workout Template:
                    </label>
                    <select
                      id="workoutSelect"
                      className="form-select bg-dark text-white border-secondary mb-3"
                      value={selectedWorkoutId || ""}
                      onChange={(e) => setSelectedWorkoutId(Number(e.target.value))}
                    >
                      <option value="">-- Select a Workout --</option>
                      {availableWorkouts.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.title}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="dateTimeInput" className="form-label">
                      Pick Date &amp; Time:
                    </label>
                    <input
                      id="dateTimeInput"
                      type="datetime-local"
                      className="form-control bg-dark text-white border-secondary"
                      value={selectedDateTime}
                      onChange={(e) => setSelectedDateTime(e.target.value)}
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleScheduleWorkout}>
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
      <Footer />
    </motion.div>
  );
}