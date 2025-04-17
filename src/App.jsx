import "./App.css";
import AIAssistantUI from "./app/AIAssistantUI";

function App() {
  const pathname = window.parent.location.pathname?.split("/")?.[1] ?? "";

  return (
    <>
      <AIAssistantUI pathname={pathname} />
    </>
  );
}

export default App;
