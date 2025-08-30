// Plant-related TypeScript interfaces and types

export interface PlantIdentification {
  label: string;
  scientificName?: string;
  confidence: number;
  description?: string;
  commonNames?: string[];
  family?: string;
  genus?: string;
  source: string;
  model?: string;
}

export interface PlantCareInfo {
  watering?: string;
  light?: string;
  maintenance?: string;
  hardiness?: string;
  growthRate?: string;
  droughtTolerant?: boolean;
  saltTolerant?: boolean;
  thorny?: boolean;
  invasive?: boolean;
  tropical?: boolean;
  indoor?: boolean;
  careLevel?: string;
}

export interface PlantDimensions {
  minHeight?: number;
  maxHeight?: number;
  unit?: string;
}

export interface PlantDetails extends PlantIdentification {
  image?: string;
  watering?: string;
  water?: string;
  light?: string;
  care?: PlantCareInfo;
  dimensions?: PlantDimensions;
  cycle?: string;
  attracts?: string[];
  propagation?: string[];
  pruningMonth?: string[];
  pruningCount?: number[];
  seeds?: number;
  flowers?: boolean;
  flowering_season?: string;
  color?: string;
  soilRequirements?: string[];
  edibleParts?: string[];
  uses?: string;
  gbifId?: string;
  inaturalistId?: string;
  synonyms?: string[];
  mlConfidence?: number;
  mlModel?: string;
  combinedConfidence?: number;
  fromML?: boolean;
  images?: string[];
}

export interface MLResult {
  label: string;
  confidence: number;
  model: string;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
}

export interface ApiKeys {
  plantId?: string;
  perenual?: string;
  plantNet?: string;
  trefle?: string;
}

export interface BaseUrls {
  plantId: string;
  perenual: string;
  plantNet: string;
  trefle: string;
}

// Plant history for user's identified plants
export interface PlantHistoryItem {
  id: string;
  plant: PlantDetails;
  capturedImage: string;
  timestamp: number;
  isFavorite?: boolean;
  notes?: string;
}

// App state interfaces
export interface AppState {
  offline: boolean;
  loading: boolean;
  error: string | null;
}

export interface CameraState {
  isActive: boolean;
  hasPermission: boolean;
  error: string | null;
}

export interface DetectionState {
  isDetecting: boolean;
  progress: number;
  currentStep: string;
}
