import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlantDetails, PlantHistoryItem, AppState, CameraState, DetectionState } from '../types/plant';

interface PlantStore {
  // App state
  appState: AppState;
  setOffline: (offline: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Camera state
  cameraState: CameraState;
  setCameraActive: (isActive: boolean) => void;
  setCameraPermission: (hasPermission: boolean) => void;
  setCameraError: (error: string | null) => void;

  // Detection state
  detectionState: DetectionState;
  setDetecting: (isDetecting: boolean) => void;
  setDetectionProgress: (progress: number) => void;
  setDetectionStep: (step: string) => void;

  // Current plant data
  currentPlant: PlantDetails | null;
  setCurrentPlant: (plant: PlantDetails | null) => void;

  // Plant history
  plantHistory: PlantHistoryItem[];
  addToHistory: (plant: PlantDetails, capturedImage: string) => void;
  removeFromHistory: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addNoteToPlant: (id: string, note: string) => void;
  clearHistory: () => void;

  // User preferences
  preferences: {
    autoSave: boolean;
    showConfidence: boolean;
    preferredApiSource: string;
    theme: 'light' | 'dark' | 'auto';
  };
  updatePreferences: (prefs: Partial<PlantStore['preferences']>) => void;
}

export const usePlantStore = create<PlantStore>()(
  persist(
    (set, get) => ({
      // Initial app state
      appState: {
        offline: false,
        loading: false,
        error: null,
      },
      setOffline: (offline) =>
        set((state) => ({
          appState: { ...state.appState, offline },
        })),
      setLoading: (loading) =>
        set((state) => ({
          appState: { ...state.appState, loading },
        })),
      setError: (error) =>
        set((state) => ({
          appState: { ...state.appState, error },
        })),

      // Initial camera state
      cameraState: {
        isActive: false,
        hasPermission: false,
        error: null,
      },
      setCameraActive: (isActive) =>
        set((state) => ({
          cameraState: { ...state.cameraState, isActive },
        })),
      setCameraPermission: (hasPermission) =>
        set((state) => ({
          cameraState: { ...state.cameraState, hasPermission },
        })),
      setCameraError: (error) =>
        set((state) => ({
          cameraState: { ...state.cameraState, error },
        })),

      // Initial detection state
      detectionState: {
        isDetecting: false,
        progress: 0,
        currentStep: '',
      },
      setDetecting: (isDetecting) =>
        set((state) => ({
          detectionState: { ...state.detectionState, isDetecting },
        })),
      setDetectionProgress: (progress) =>
        set((state) => ({
          detectionState: { ...state.detectionState, progress },
        })),
      setDetectionStep: (currentStep) =>
        set((state) => ({
          detectionState: { ...state.detectionState, currentStep },
        })),

      // Current plant
      currentPlant: null,
      setCurrentPlant: (plant) => set({ currentPlant: plant }),

      // Plant history
      plantHistory: [],
      addToHistory: (plant, capturedImage) => {
        const newItem: PlantHistoryItem = {
          id: Date.now().toString(),
          plant,
          capturedImage,
          timestamp: Date.now(),
          isFavorite: false,
        };
        set((state) => ({
          plantHistory: [newItem, ...state.plantHistory],
        }));
      },
      removeFromHistory: (id) =>
        set((state) => ({
          plantHistory: state.plantHistory.filter((item) => item.id !== id),
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          plantHistory: state.plantHistory.map((item) =>
            item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
          ),
        })),
      addNoteToPlant: (id, note) =>
        set((state) => ({
          plantHistory: state.plantHistory.map((item) =>
            item.id === id ? { ...item, notes: note } : item
          ),
        })),
      clearHistory: () => set({ plantHistory: [] }),

      // User preferences
      preferences: {
        autoSave: true,
        showConfidence: true,
        preferredApiSource: 'auto',
        theme: 'auto',
      },
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
    }),
    {
      name: 'plant-store',
      // Only persist certain parts of the store
      partialize: (state) => ({
        plantHistory: state.plantHistory,
        preferences: state.preferences,
      }),
    }
  )
);

// Selectors for better performance
export const useAppState = () => usePlantStore((state) => state.appState);
export const useCameraState = () => usePlantStore((state) => state.cameraState);
export const useDetectionState = () => usePlantStore((state) => state.detectionState);
export const useCurrentPlant = () => usePlantStore((state) => state.currentPlant);
export const usePlantHistory = () => usePlantStore((state) => state.plantHistory);
export const usePreferences = () => usePlantStore((state) => state.preferences);
