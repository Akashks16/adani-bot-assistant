import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import AIAssistantUI from "./app/AIAssistantUI";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <AIAssistantUI />
    </>
  );
}

export default App;
