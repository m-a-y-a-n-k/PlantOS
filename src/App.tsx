import React, { useState, useEffect, Suspense, lazy } from "react";
import "./App.css";
import leaf from "./healthy.jpg";
import { usePlantStore } from "./stores/plantStore";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Lazy load components for better performance
const Canvas = lazy(() => import("./components/Canvas"));
const PlantScenery = lazy(() => import("./components/Scenery"));
const PlantHistory = lazy(() => import("./components/plant/PlantHistory"));

const App: React.FC = () => {
  const { appState, setOffline } = usePlantStore();
  const [showHistory, setShowHistory] = useState(false);

  const updateShowHistory = (history: boolean) => () => {
    setShowHistory(history);
  };

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
              onClick={updateShowHistory(true)}
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
            <Suspense fallback={<LoadingSpinner message="Loading camera..." />}>
              <Canvas offline={appState.offline} />
            </Suspense>
          </ErrorBoundary>
        </main>
        <footer className="App-footer">
          <ErrorBoundary fallback={
            <div className="scenery-error">
              <p>Interactive scenery is temporarily unavailable.</p>
            </div>
          }>
            <Suspense fallback={<LoadingSpinner message="Loading scenery..." />}>
              <PlantScenery />
            </Suspense>
          </ErrorBoundary>
        </footer>
        
        {showHistory && (
          <Suspense fallback={<LoadingSpinner message="Loading plant history..." />}>
            <PlantHistory 
              onClose={updateShowHistory(false)}
              onSelectPlant={(plant) => {
                // Could open detailed view here
              }}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
