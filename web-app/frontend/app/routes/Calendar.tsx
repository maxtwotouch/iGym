import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
// import 'bootstrap/dist/css/bootstrap.css';
// import '@fullcalendar/bootstrap5';


const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";


export default function Calendar() {
  const navigate = useNavigate();

  // For storing scheduled workouts
  const [workouts, setWorkouts] = useState<any[]>([]);
  
  // For storing workout templates
  const [availableWorkouts, setAvailableWorkouts] = useState<any[]>([]);

  // UI state
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // For the “view details” modal
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  // For the “schedule new workout” modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);

  // <-- This is the main difference: we store a string for date/time
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");

  // Load scheduled workouts
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // Example: fetch scheduled workouts
    const fetchScheduledWorkouts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${backendUrl}/scheduled_workouts/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch scheduled workouts");
        }
        const data = await response.json();
        
        // Convert to FullCalendar event objects
        const formatted = data.map((item: any) => ({
          id: item.id,
          title: item.workout_title,
          start: item.scheduled_date,
          end: new Date(new Date(item.scheduled_date).getTime() + 60 * 60 * 1000).toISOString()
        }));
        setWorkouts(formatted);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load scheduled workouts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduledWorkouts();
  }, [navigate]);

  // Load available workout templates
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
    // FullCalendar's arg.date is a JS date object with date + time (often midnight if you are in dayGridMonth).
    // We can create an ISO string suitable for <input type="datetime-local" /> but must slice off seconds & decimals.
    
    const dateObj = arg.date; // a JS date
    // Convert to "YYYY-MM-DDTHH:MM" string
    // Note: toISOString() => "YYYY-MM-DDTHH:MM:SS.sssZ"
    // We'll drop the last part for a local input:
    const localDateTime = new Date(dateObj.getTime() - dateObj.getTimezoneOffset()*60000)
      .toISOString()
      .slice(0, 16); // "YYYY-MM-DDTHH:MM"

    setSelectedDateTime(localDateTime);
    setShowScheduleModal(true);
  };

  // POST to schedule a workout
  const handleScheduleWorkout = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token || !selectedWorkoutId || !selectedDateTime) return;

    // Convert the user-chosen local date/time to full ISO:
    // If the user is in a certain timezone, <input type="datetime-local" />
    // does not store the offset. We can parse it manually.
    const fullDate = new Date(selectedDateTime);
    // Convert to UTC ISO string:
    const isoDateTime = fullDate.toISOString();

    const postData = {
      // The key must match your serializer's field:
      // `workout_template = models.ForeignKey(...)`
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
      
      // Add the new event to our local array
      const newEvent = {
        id: newSession.id,
        title: newSession.workout_title,
        start: newSession.scheduled_date,
        end: new Date(new Date(newSession.scheduled_date).getTime() + 60 * 60 * 1000).toISOString()
      };
      setWorkouts((prev) => [...prev, newEvent]);

      // Reset
      setShowScheduleModal(false);
      setSelectedWorkoutId(null);
      setSelectedDateTime("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to schedule workout");
    }
  };

  // View details modal
  const handleEventClick = (info: any) => {
    const event = workouts.find((w) => w.id.toString() === info.event.id);
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
                events={workouts}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                // for time selection via drag, you can enable "selectable: true," and use "select" event
                // selectable={true}
                // select={handleSelect}
                height="auto"
                themeSystem="bootstrap5"
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
                    <button type="button" className="btn-close btn-close-white"
                            onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <p><strong>Date:</strong> {new Date(selectedEvent.start).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {new Date(selectedEvent.start).toLocaleTimeString()} - 
                      {new Date(selectedEvent.end).toLocaleTimeString()}</p>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate(`/workouts/update/${selectedEvent.id}`)}
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
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowScheduleModal(false)}
                    ></button>
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

                    {/* Input for date+time */}
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
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowScheduleModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleScheduleWorkout}
                    >
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