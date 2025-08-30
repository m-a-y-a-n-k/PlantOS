import { useEffect, useState } from 'react';
import { MLResult } from '../types/plant';

// Declare ml5 global
declare global {
  interface Window {
    ml5: any;
  }
}

const ml5 = (window as any).ml5;

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
  
  const results = [];
  
  // Use MobileNet for general classification
  if (classifiers.mobilenet) {
    try {
      const mobileNetResults = await classifiers.mobilenet.classify(processedCanvas);
      results.push(...mobileNetResults.map((r: any) => ({ ...r, model: 'MobileNet' })));
    } catch (error) {
      console.warn('MobileNet classification failed:', error);
    }
  }
  
  // Use DenseNet for more detailed classification
  if (classifiers.densenet) {
    try {
      const denseNetResults = await classifiers.densenet.classify(processedCanvas);
      results.push(...denseNetResults.map((r: any) => ({ ...r, model: 'DenseNet' })));
    } catch (error) {
      console.warn('DenseNet classification failed:', error);
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
  
  // If we found plant-specific results, prioritize them
  if (plantResults.length > 0) {
    return plantResults.sort((a: any, b: any) => b.confidence - a.confidence);
  }
  
  // Otherwise return all results sorted by confidence
  return results.sort((a: any, b: any) => b.confidence - a.confidence);
}

// Enhanced plant detector hook with multiple models
export default function usePlantDetector() {
  const [classifiers, setClassifiers] = useState({
    mobilenet: null,
    densenet: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeModels = async () => {
      try {
        setLoading(true);
        
        // Initialize MobileNet (fast, general purpose)
        const mobilenet = ml5.imageClassifier("MobileNet");
        
        // Try to initialize DenseNet (more accurate for complex images)
        let densenet = null;
        try {
          densenet = ml5.imageClassifier("DenseNet");
        } catch (denseNetError) {
          console.warn('DenseNet not available, using MobileNet only:', denseNetError);
        }
        
        setClassifiers({
          mobilenet,
          densenet
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