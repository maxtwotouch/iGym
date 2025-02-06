import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/helloWorld")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => setMessage("Error fetching data"));
  }, []);

  return (
    <div>
      <h1>Backend Communication Test</h1>
      <p>{message}</p>
    </div>
  );
}

