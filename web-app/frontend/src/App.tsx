// App.tsx
import { Routes, Route } from "react-router-dom";

// Import all page components:
import LandingPage from "./routes/LandingPage";
import Login from "./routes/Login";
import Registration from "./routes/Registration";
import Dashboard from "./routes/Dashboard";
import Exercises from "./routes/Exercises";
import CreateWorkout from "./routes/CreateWorkout";
import ExerciseSelection from "./routes/ExerciseSelection";
import EditWorkout from "./routes/EditWorkout";
import ExerciseDetail from "./routes/ExerciseDetail";
import About from "./routes/About";
import Calendar from "./routes/Calendar";
import WorkoutSession from "./routes/WorkoutSession";
import Chat from "./routes/Chat";
import SelectPT from "./routes/SelectPT";
import Profile from "./routes/ProfilePage";

function App() {
  return (
    <Routes>
      {/* The 'index()' route → path="/" */}
      <Route path="/" element={<LandingPage />} />

      {/* route("login", "routes/Login.tsx") → path="/login" */}
      <Route path="/login" element={<Login />} />

      {/* route("register", "routes/Registration.tsx") → path="/register" */}
      <Route path="/register" element={<Registration />} />

      {/* route("dashboard", "routes/Dashboard.tsx") → path="/dashboard" */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* route("exercises", "routes/Exercises.tsx") → path="/exercises" */}
      <Route path="/exercises" element={<Exercises />} />

      {/* route("workouts/create", "routes/CreateWorkout.tsx") → path="/workouts/create" */}
      <Route path="/workouts/create" element={<CreateWorkout />} />

      {/* route("workouts/create/exercises", "routes/ExerciseSelection.tsx") → /workouts/create/exercises */}
      <Route path="/workouts/create/exercises" element={<ExerciseSelection />} />

      {/* route("workouts/update/:id", "routes/EditWorkout.tsx") → path="/workouts/update/:id" */}
      <Route path="/workouts/update/:id" element={<EditWorkout />} />

      {/* route("exercises/:id", "routes/ExerciseDetail.tsx") → path="/exercises/:id" */}
      <Route path="/exercises/:id" element={<ExerciseDetail />} />

      {/* route("about", "routes/About.tsx") → path="/about" */}
      <Route path="/about" element={<About />} />

      {/* route("calendar", "routes/Calendar.tsx") → path="/calendar" */}
      <Route path="/calendar" element={<Calendar />} />

      {/* route(":id/workout/session/create", "routes/WorkoutSession.tsx") → path="/:id/workout/session/create" */}
      <Route path=":id/workout/session/create" element={<WorkoutSession />} />

      {/* route("chat", "routes/Chat.tsx") → path="/chat" */}
      <Route path="/chat" element={<Chat />} />

      {/* route("personalTrainers", "routes/SelectPT.tsx") → path="/personalTrainers" */}
      <Route path="/personalTrainers" element={<SelectPT />} />
       {/* route("personalTrainers", "routes/SelectPT.tsx") → path="/personalTrainers" */}
       <Route path="/profile" element={< Profile/>} />

      {/* Add a NotFound or catch-all route if desired */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}

export default App;