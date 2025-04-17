import { useEffect, useState } from "react";
import "./App.css";
import AIAssistantUI from "./app/AIAssistantUI";

function App() {
  // const pathname = window?.parent?.location?.pathname?.split("/")?.[1] ?? "";
  const [pathname, setPathname] = useState("");

  // const pathname = "";

  useEffect(() => {
    // Function to handle messages from parent
    const handleMessage = (event) => {
      // Verify the origin is your parent app for security

      // Check if this is a location response
      if (event.data.type === "LOCATION_DATA") {
        const data = event?.data?.data?.url.replace("/", "");
        setPathname(data);
      }
    };

    // Add event listener
    window.addEventListener("message", handleMessage);

    // Request location from parent when component mounts
    console.log("triggereed");

    window.parent.postMessage(
      {
        type: "REQUEST_LOCATION",
      },
      "*"
    ); // Use specific origin in production instead of '*'

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  console.log("pathname: ", pathname);

  return (
    <>
      <AIAssistantUI pathname={pathname} />
    </>
  );
}

export default App;
