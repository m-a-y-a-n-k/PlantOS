import { useEffect, useState } from 'react';
import { MLResult } from '../types/plant';

// Declare ml5 global
declare global {
  interface Window {
    ml5: any;
  }
}

const ml5 = (window as any).ml5;

function loadMl5Classifier(modelName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!ml5?.imageClassifier) {
      reject(new Error('ml5 is not available. Ensure it is loaded in public/index.html'));
      return;
    }

    try {
      // ml5 imageClassifier is callback-based; some builds also return a promise.
      const maybeClassifier = ml5.imageClassifier(modelName, () => {
        resolve(maybeClassifier);
      });

      if (maybeClassifier && typeof maybeClassifier.then === 'function') {
        (maybeClassifier as Promise<any>).then(resolve).catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

// Image preprocessing for better plant detection
function preprocessImage(imageElement: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Set canvas size to model input requirements
  canvas.width = 224;
  canvas.height = 224;
  
  // Draw and resize image
  ctx.drawImage(imageElement, 0, 0, 224, 224);
  
  // Apply image enhancements for plant detection
  const imageData = ctx.getImageData(0, 0, 224, 224);
  const data = imageData.data;
  
  // Enhance green channel for better plant detection
  for (let i = 0; i < data.length; i += 4) {
    // Enhance green channel (plants are typically green)
    data[i + 1] = Math.min(255, data[i + 1] * 1.1);
    
    // Reduce noise by slight smoothing
    if (i > 4 && i < data.length - 4) {
      const avgR = (data[i - 4] + data[i] + data[i + 4]) / 3;
      const avgG = (data[i - 3] + data[i + 1] + data[i + 5]) / 3;
      const avgB = (data[i - 2] + data[i + 2] + data[i + 6]) / 3;
      
      data[i] = avgR;
      data[i + 1] = avgG;
      data[i + 2] = avgB;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Enhanced detection with multiple models
async function detect(base64: string, classifiers: any): Promise<MLResult[]> {
  const img = new Image();
  img.src = base64;
  await img.decode();
  
  // Preprocess image for better plant detection
  const processedCanvas = preprocessImage(img);
  
  const results: Array<{ label: string; confidence: number; model: string }> = [];
  
  // Use MobileNet for general classification (generic, but fast offline fallback)
  if (classifiers.mobilenet) {
    try {
      const mobileNetResults = await classifiers.mobilenet.classify(processedCanvas);
      results.push(
        ...mobileNetResults.map((r: any) => ({
          label: String(r.label ?? ''),
          confidence: Number(r.confidence ?? 0),
          model: 'MobileNet',
        }))
      );
    } catch (error) {
      console.warn('MobileNet classification failed:', error);
    }
  }
  
  // Filter and enhance plant-related results
  const plantKeywords = [
    'plant', 'leaf', 'flower', 'tree', 'grass', 'herb', 'fern', 'moss',
    'succulent', 'cactus', 'vine', 'shrub', 'bush', 'weed', 'bloom',
    'petal', 'stem', 'root', 'seed', 'fruit', 'vegetable', 'crop'
  ];
  
  const plantResults = results.filter((result: any) => 
    plantKeywords.some((keyword: string) => 
      result.label.toLowerCase().includes(keyword)
    )
  );

  // If results look "non-plant", keep them but don't over-trust them:
  // return both plant-filtered and unfiltered for upstream logic to decide.
  const sortedAll = results.sort((a, b) => b.confidence - a.confidence);
  
  // If we found plant-specific results, prioritize them
  if (plantResults.length > 0) {
    return plantResults.sort((a: any, b: any) => b.confidence - a.confidence);
  }
  
  // Otherwise return all results sorted by confidence
  return sortedAll;
}

// Enhanced plant detector hook with multiple models
export default function usePlantDetector() {
  const [classifiers, setClassifiers] = useState({
    mobilenet: null as any
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeModels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize MobileNet and wait until it's actually ready.
        const mobilenet = await loadMl5Classifier('MobileNet');
        
        setClassifiers({
          mobilenet
        });
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load AI models');
        setLoading(false);
      }
    };

    initializeModels();
  }, []);

  const ready = !loading && !error && classifiers.mobilenet;

  return { 
    detect, 
    ready, 
    classifiers, 
    loading, 
    error,
    modelCount: Object.values(classifiers).filter(Boolean).length
  };
}