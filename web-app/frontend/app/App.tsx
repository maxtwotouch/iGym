import {
    RouterProvider,
    createBrowserRouter,
  } from "react-router-dom";
  import LandingPage from "./components/LandingPage";
  import Login from "./components/Login"; // Fix: Import the Login Page, not LoginForm
  import Registration from "./components/Registration"; // Fix: Import Registration Page
  
  const router = createBrowserRouter([
    { path: "/", element: <LandingPage /> },
    { path: "/login", element: <Login /> }, // Fix: Use the correct component
    { path: "/registration", element: <Registration /> }, // Fix: Use the correct component
  ]);
  
  function App() {
    return <RouterProvider router={router} />;
  }
  
  export default App;