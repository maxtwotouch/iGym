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


// Define workout and customer types
interface Workout {
  id: number;
  title: string;
  start: string;
  end: string;
  customerId?: number;
  customerName?: string;
  description?: string;
  color?: string;
}

interface Customer {
  id: number;
  username: string;
}

export default function Calendar() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTrainer, setIsTrainer] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<Workout | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userType = localStorage.getItem("userType");
    
    if (!token) {
      navigate("/login");
      return;
    }

    setIsTrainer(userType === "trainer");
    
    // Fetch data
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // If trainer, fetch all customers first
        if (userType === "trainer") {
          const customersResponse = await fetch("http://localhost:8000/api/trainer/customers/", {
            headers: { 
              Authorization: `Bearer ${token}` 
            }
          });
          
          if (!customersResponse.ok) {
            throw new Error("Failed to fetch customers");
          }
          
          const customersData = await customersResponse.json();
          setCustomers(customersData);
        }

        // Fetch workouts (either for the user or all customers if trainer)
        const url = userType === "trainer" 
          ? "http://localhost:8000/api/trainer/workouts/"
          : "http://localhost:8000/api/workouts/calendar/";
          
        const response = await fetch(url, {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch calendar data");
        }

        const data = await response.json();
        
        // Format workouts for calendar
        const formattedWorkouts = data.map((workout: any) => ({
          id: workout.id,
          title: workout.title,
          start: workout.scheduled_date,
          end: workout.end_time || new Date(new Date(workout.scheduled_date).getTime() + 60*60*1000).toISOString(), // Default 1hr if no end
          customerId: workout.customer_id,
          customerName: workout.customer_name,
          description: workout.description,
          color: userType === "trainer" ? getCustomerColor(workout.customer_id) : "#3788d8"
        }));

        setWorkouts(formattedWorkouts);
      } catch (err: any) {
        console.error("Error fetching calendar data:", err);
        setError(err.message || "Failed to load calendar data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Generate consistent colors for different customers
  const getCustomerColor = (customerId: number): string => {
    const colors = [
      "#3788d8", "#ff8800", "#28a745", "#dc3545", "#6f42c1", 
      "#fd7e14", "#20c997", "#e83e8c", "#17a2b8", "#6c757d"
    ];
    return colors[customerId % colors.length];
  };

  const handleEventClick = (info: any) => {
    const workout = workouts.find(w => w.id.toString() === info.event.id);
    if (workout) {
      setSelectedEvent(workout);
      setShowModal(true);
    }
  };

  const handleCustomerFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCustomer(value === "all" ? "all" : parseInt(value));
  };

  const filteredWorkouts = isTrainer && selectedCustomer !== "all" 
    ? workouts.filter(workout => workout.customerId === selectedCustomer)
    : workouts;

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
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {isTrainer && (
            <div className="mb-4">
              <label htmlFor="customerFilter" className="form-label">Filter by Customer:</label>
              <select 
                id="customerFilter" 
                className="form-select bg-dark text-white border-secondary" 
                value={selectedCustomer === "all" ? "all" : selectedCustomer.toString()}
                onChange={handleCustomerFilter}
              >
                <option value="all">All Customers</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id.toString()}>
                    {customer.username}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={filteredWorkouts}
                eventClick={handleEventClick}
                height="auto"
                themeSystem="bootstrap"
                // Custom styles for dark theme
                eventBackgroundColor="#3788d8"
                eventBorderColor="#2c6cb0"
                dayCellClassNames="bg-dark-subtle text-white-50"
                slotLabelClassNames="text-white-50"
                dayHeaderClassNames="text-white"
              />
            )}
          </div>

          {/* Event Detail Modal */}
          {showModal && selectedEvent && (
            <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content bg-dark text-white">
                  <div className="modal-header">
                    <h5 className="modal-title">{selectedEvent.title}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    {isTrainer && selectedEvent.customerName && (
                      <p><strong>Customer:</strong> {selectedEvent.customerName}</p>
                    )}
                    <p><strong>Date:</strong> {new Date(selectedEvent.start).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {new Date(selectedEvent.start).toLocaleTimeString()} - {new Date(selectedEvent.end).toLocaleTimeString()}</p>
                    {selectedEvent.description && (
                      <p><strong>Description:</strong> {selectedEvent.description}</p>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
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
        </motion.div>
      </motion.div>
      <Footer />
    </motion.div>
  );
}