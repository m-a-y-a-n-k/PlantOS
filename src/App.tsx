import React, { useState, useEffect } from "react";
import "./App.css";
import leaf from "./healthy.jpg";
import { usePlantStore } from "./stores/plantStore";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Canvas from "./components/Canvas";
import PlantScenery from "./components/Scenery";
import PlantHistory from "./components/plant/PlantHistory";

const App: React.FC = () => {
  const { appState, setOffline } = usePlantStore();
  const [showHistory, setShowHistory] = useState(false);

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
  }, [setOffline]);

  return (
    <ErrorBoundary>
      <div className="App">
        <header className="App-header">
          <img src={leaf} className="App-logo" alt="Healthy Leaves" />
          <div className="header-content">
            <h1 className="App-title">Plant OS</h1>
            <h4 className="App-subtitle">
              Know your plant better through AI-powered insights.
            </h4>
          </div>
          <div className="header-actions">
            <button 
              className="history-button"
              onClick={() => setShowHistory(true)}
              title="View Plant History"
            >
              📚 History
            </button>
            {appState.offline && (
              <div className="offline-indicator">
                📶 Offline
              </div>
            )}
          </div>
        </header>
        <main className="mainContent">
          <ErrorBoundary fallback={
            <div className="canvas-error">
              <p>Camera component failed to load. Please refresh the page.</p>
            </div>
          }>
            <Canvas offline={appState.offline} />
          </ErrorBoundary>
        </main>
        <footer className="App-footer">
          <ErrorBoundary fallback={
            <div className="scenery-error">
              <p>Interactive scenery is temporarily unavailable.</p>
            </div>
          }>
            <PlantScenery />
          </ErrorBoundary>
        </footer>
        
        {showHistory && (
          <PlantHistory 
            onClose={() => setShowHistory(false)}
            onSelectPlant={(plant) => {
              console.log('Selected plant:', plant);
              // Could open detailed view here
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
