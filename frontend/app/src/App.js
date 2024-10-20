import React, { useState, useEffect } from "react";
import "./App.css";
import leaf from "./healthy.jpg";
import Notifier from "./components/Notifier";
import Canvas from "./components/Canvas";

const App = () => {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setOffline(!navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Initial check for online status
    updateOnlineStatus();

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={leaf} className="App-logo" alt="Healthy Leaves" />
        <h1 className="App-title">Plant OS</h1>
        <h4 className="App-subtitle">
          {" "}
          - Know your plant better through statistic insights.
        </h4>
      </header>
      <Notifier offline={offline} />
      <Canvas offline={offline} />
    </div>
  );
};

export default App;
