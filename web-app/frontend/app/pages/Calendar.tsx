import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { fetchScheduledWorkouts } from "~/utils/api/scheduledWorkouts"; // Import the function to fetch scheduled workouts

import { mapWorkoutSessionsToCalendarEvents } from "~/utils/calendarHelper";

import apiClient from "~/utils/api/apiClient";

export const Calendar = () => {
    const navigate = useNavigate();

    // Store calendar events (both scheduled workouts and workout sessions)
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [availableWorkouts, setAvailableWorkouts] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // For modals & scheduling
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showPtScheduleModal, setShowPtScheduleModal] = useState(false); 
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
    const [selectedDateTime, setSelectedDateTime] = useState<string>("");

    const [clientList, setClientList] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [userType, setUserType] = useState<string | null>(null);

    useEffect(() => {
      setUserType(localStorage.getItem("userType"));
    }, [navigate]);

    useEffect(() => { // Fetch the pt's clients, if the current user is a pt
      if (userType === "trainer") {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }
  
        const fetchClients = async () => {
          try {
            const response = await fetch(`${backendUrl}/trainer/clients/`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
      
            if (!response.ok) {
              throw new Error("Failed to fetch clients");
            }
      
            const data = await response.json();
            setClientList(data);
          } catch (error) {
            console.error("Error fetching clients:", error);
          }
        };
  
        fetchClients();
      }
    }, [userType]);

    useEffect(() => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
          navigate("/login");
          return;
      }

      const fetchPersonalTrainerScheduledWorkouts = async () => {
        try {
          const response = await fetch(`${backendUrl}/schedule/pt_workout/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
    
          if (!response.ok) {
            throw new Error("Failed to fetch PT scheduled workouts");
          }
    
          const data = await response.json();
          const now = new Date();
    
          // Array to hold delete promises
          const deletePromises = [];
    
          for (const item of data) {
            if (new Date(item.scheduled_date) < now) {
              try {
                // Hold the promise for the delete operation
                const deletePromise = fetch(`${backendUrl}/schedule/pt_workout/delete/${item.id}/`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` }
                });
                deletePromises.push(deletePromise); // Keep track of delete promises
              } catch (err) {
                console.error(`Failed to delete past scheduled workout ${item.id}:`, err);
              }
            }
          }
    
          // Wait for all delete promises to resolve
          await Promise.all(deletePromises);
    
          // Now, fetch the updated list of scheduled workouts
          const updatedResponse = await fetch(`${backendUrl}/schedule/pt_workout/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
    
          if (!updatedResponse.ok) {
            throw new Error("Failed to fetch scheduled workouts after deletion");
          }
    
          const updatedData = await updatedResponse.json(); // Get updated data
    
          return updatedData.map((item: any) => {
            const isPt = item.pt === parseInt(localStorage.getItem("user_id") || "-1");
            const client = clientList.find((client) => client.id === item.client);
    
            return {
              id: `pt-scheduled-${item.id}`,
              workout_id: item.workout_template,
              start: item.scheduled_date,
              title: isPt
                ? `${item.workout_title} with ${client?.username || "Client"}`
                : `${item.workout_title} with PT`
            };
          });
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to load PT scheduled workouts");
          return [];
        }
      };

    

    const loadEvents = async () => {
      setIsLoading(true);
      const scheduledEvents = await fetchScheduledWorkouts(token);
      const sessionEvents = await mapWorkoutSessionsToCalendarEvents(token);
      const ptScheduledEvents = await fetchPersonalTrainerScheduledWorkouts();
      // Merge both arrays into one event list
      setCalendarEvents([...scheduledEvents, ...sessionEvents, ...ptScheduledEvents]);
      setIsLoading(false);
    };

    loadEvents();
  }, [clientList]);

  // Load available workout templates for scheduling
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

    const postData = {
      workout_template: selectedWorkoutId,
      scheduled_date: isoDateTime
    };

    try {

      const response = await apiClient.post('/schedule/workout/create/', postData);

      if (response.status !== 201) {
        throw new Error("Failed to schedule workout");
      }
      const newSession = await response.data;

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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to schedule workout");
    }
  };

    // POST to schedule a workout with pt
    const handlePtScheduleWorkout = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token || !selectedWorkoutId || !selectedDateTime) return;
  
      // Convert local date/time from input to full ISO string
      const fullDate = new Date(selectedDateTime);
      const isoDateTime = fullDate.toISOString();
  
      // Check if the selected date is in the past
      const now = new Date();
      if (fullDate < now) {
        alert("You cannot schedule a workout in the past."); // Set error message
        return;
      }
  
      const postData = {
        client: selectedClientId,
        workout_template: selectedWorkoutId,
        scheduled_date: isoDateTime
      };
  
      try {
        const response = await fetch(`${backendUrl}/schedule/pt_workout/create/`, {
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
  
        const client = clientList.find((client) => client.id === selectedClientId);
  
        const newEvent = {
          id: `pt-scheduled-${newSession.id}`,
          workout_id: newSession.workout_template,
          start: newSession.scheduled_date,
          title: `${newSession.workout_title} with ${client.username}`
        };
  
        setCalendarEvents((prev) => [...prev, newEvent]);
  
        // Reset modal state
        setShowPtScheduleModal(false);
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
                      <strong>Time:</strong> {new Date(selectedEvent.start).toLocaleTimeString()}
                      {selectedEvent.end && !isNaN(new Date(selectedEvent.end).getTime()) ? ` - ${new Date(selectedEvent.end).toLocaleTimeString()}` : ""}
                    </p>
                    {selectedEvent.duration && (
                      <p>
                        <strong>Duration:</strong> {selectedEvent.duration}
                      </p>
                    )}

                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      name="closeButton"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                   
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate(`/workouts/update/${selectedEvent.workout_id}`)}
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
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      name="scheduleButton"
                      onClick={handleScheduleWorkout}
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showPtScheduleModal && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content bg-dark text-white">
                  <div className="modal-header">
                    <h5 className="modal-title">Schedule Workout for a Client</h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowPtScheduleModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {/* Select Client */}
                    <label htmlFor="clientSelect" className="form-label">
                      Select a Client:
                    </label>
                    <select
                      id="clientSelect"
                      className="form-select bg-dark text-white border-secondary mb-3"
                      value={selectedClientId || -1}
                      onChange={(e) => setSelectedClientId(Number(e.target.value))}
                    >
                      <option value="">-- Select a Client --</option>
                      {clientList.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.username}
                        </option>
                      ))}
                    </select>

                    {/* Select Workout */}
                    <label htmlFor="workoutSelectPt" className="form-label">
                      Select a Workout Template:
                    </label>
                    <select
                      id="workoutSelectPt"
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

                    {/* Select Time */}
                    <label htmlFor="dateTimeInputPt" className="form-label">
                      Pick Date &amp; Time:
                    </label>
                    <input
                      id="dateTimeInputPt"
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
                      onClick={() => setShowPtScheduleModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      name="ptScheduleButton"
                      onClick={handlePtScheduleWorkout}
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
    </motion.div>
  );
}