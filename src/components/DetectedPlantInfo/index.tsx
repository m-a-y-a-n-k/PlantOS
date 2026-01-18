import React, { useEffect, useState } from "react";
import usePlantDetector from "../../helpers/plantDetector";
import "./styles.css";
import { fetchPlantInfo } from "../../helpers/fetchPlantInfo";
import LoadingSpinner from "../common/LoadingSpinner";
import { usePlantStore } from "../../stores/plantStore";
import { PlantDetails } from "../../types/plant";

interface DetectedPlantInfoProps {
  capturedImage: string;
  closeDialog: () => void;
}

const DetectedPlantInfo: React.FC<DetectedPlantInfoProps> = ({ capturedImage, closeDialog }) => {
  const { detect, ready, classifiers, loading, error, modelCount } = usePlantDetector();
  const [plant, setPlant] = useState<PlantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  
  const { 
    setCurrentPlant, 
    addToHistory, 
    setDetecting, 
    setDetectionProgress, 
    setDetectionStep,
    preferences 
  } = usePlantStore();

  useEffect(() => {
    if (ready && capturedImage) {
      (async () => {
        try {
          setIsLoading(true);
          setDetectionError(null);
          setDetecting(true);
          setDetectionStep('Analyzing image with AI models...');
          setDetectionProgress(10);
          
          // First, try ML5 detection
          const mlResults = await detect(capturedImage, classifiers);
          setDetectionProgress(40);
          setDetectionStep('Identifying plant species...');
          
          let bestMlResult = null;
          if (mlResults.length > 0) {
            bestMlResult = mlResults[0]; // Already sorted by confidence
          }
          
          setDetectionProgress(60);
          setDetectionStep('Fetching detailed plant information...');
          
          // Then get detailed plant info using both ML result and image
          const plantDetails = await fetchPlantInfo(
            bestMlResult?.label || 'Unknown Plant',
            capturedImage
          );
          
          setDetectionProgress(90);
          setDetectionStep('Finalizing results...');
          
          // Combine ML5 confidence with API result
          if (plantDetails && bestMlResult) {
            plantDetails.mlConfidence = bestMlResult.confidence;
            plantDetails.mlModel = bestMlResult.model;
            plantDetails.combinedConfidence = (
              (bestMlResult.confidence + (plantDetails.confidence || 0)) / 2
            );
          }

          // If the API explicitly thinks this is not a plant, surface a clearer message.
          if (plantDetails?.isPlant?.binary === false && (plantDetails.isPlant.probability ?? 0) > 0.6) {
            throw new Error('This image does not appear to contain a plant. Try focusing on leaves/flowers and improving lighting.');
          }
          
          setPlant(plantDetails);
          setCurrentPlant(plantDetails);
          setDetectionProgress(100);
          
          // Auto-save to history if enabled
          if (preferences.autoSave && plantDetails) {
            addToHistory(plantDetails, capturedImage);
          }
          
        } catch (err) {
          console.error('Plant detection failed:', err);
          setDetectionError(err instanceof Error ? err.message : 'Detection failed');
          
          // Try to get fallback info
          try {
            const fallbackInfo = await fetchPlantInfo('Unknown Plant');
            setPlant(fallbackInfo);
            setCurrentPlant(fallbackInfo);
          } catch (fallbackErr) {
            console.error('Fallback also failed:', fallbackErr);
          }
        } finally {
          setIsLoading(false);
          setDetecting(false);
          setDetectionProgress(0);
          setDetectionStep('');
        }
      })();
    }
  }, [ready, capturedImage, detect, classifiers, setCurrentPlant, addToHistory, preferences.autoSave, setDetecting, setDetectionProgress, setDetectionStep]);

  const { detectionState } = usePlantStore();

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="plant-info-dialog">
        <div className="plant-info-card">
          <span className="plant-info-dialog-close" onClick={closeDialog}>
            ×
          </span>
          <LoadingSpinner
            size="large"
            message={loading ? 'Loading AI models...' : 'Analyzing Plant...'}
            progress={detectionState.progress}
            step={detectionState.currentStep}
          />
          {modelCount > 0 && (
            <p className="model-info">Using {modelCount} AI model{modelCount > 1 ? 's' : ''}</p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error || detectionError) {
    return (
      <div className="plant-info-dialog">
        <div className="plant-info-card">
          <span className="plant-info-dialog-close" onClick={closeDialog}>
            ×
          </span>
          <h2>Detection Error</h2>
          <p>We encountered an issue while analyzing your plant:</p>
          <p className="error-message">{error || detectionError}</p>
          <p>Please try again with a clearer image of the plant.</p>
        </div>
      </div>
    );
  }

  // No plant detected
  if (!plant) {
    return (
      <div className="plant-info-dialog">
        <div className="plant-info-card">
          <span className="plant-info-dialog-close" onClick={closeDialog}>
            ×
          </span>
          <h2>Plant Not Detected</h2>
          <p>We couldn't identify a plant in this image.</p>
          <p>Please try again with:</p>
          <ul>
            <li>A clearer image of the plant</li>
            <li>Better lighting conditions</li>
            <li>Focus on leaves, flowers, or distinctive features</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="plant-info-dialog">
      <div className="plant-info-card">
        <span className="plant-info-dialog-close" onClick={closeDialog}>
          ×
        </span>
        
        {/* Plant identification header */}
        <div className="plant-header">
          <h2 className="plant-name">{plant.label}</h2>
          {plant.scientificName && (
            <p className="plant-scientific">
              <em>{plant.scientificName}</em>
            </p>
          )}
          
          {/* Confidence and source info */}
          <div className="confidence-info">
            {plant.combinedConfidence && (
              <span className="confidence-badge">
                {Math.round(plant.combinedConfidence * 100)}% confident
              </span>
            )}
            {plant.source && (
              <span className="source-badge">
                via {plant.source}
              </span>
            )}
            {plant.mlModel && (
              <span className="model-badge">
                {plant.mlModel}
              </span>
            )}
          </div>
        </div>

        {/* Plant image */}
        {plant.image && (
          <div className="plant-image-container">
            <img
              className="plant-image"
              src={plant.image}
              alt={plant.label}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Plant description */}
        {plant.description && (
          <div className="plant-section">
            <h3>Description</h3>
            <p className="plant-description">{plant.description}</p>
          </div>
        )}

        {/* Care information */}
        <div className="care-info">
          {plant.light && (
            <div className="care-item">
              <strong>💡 Light:</strong> {plant.light}
            </div>
          )}
          {(plant.water || plant.watering) && (
            <div className="care-item">
              <strong>💧 Water:</strong> {plant.water || plant.watering}
            </div>
          )}
          {plant.care?.maintenance && (
            <div className="care-item">
              <strong>🔧 Maintenance:</strong> {plant.care.maintenance}
            </div>
          )}
          {plant.care?.hardiness && (
            <div className="care-item">
              <strong>🌡️ Hardiness:</strong> {plant.care.hardiness}
            </div>
          )}
        </div>

        {/* Health assessment (Plant.id) */}
        {(plant.healthAssessment?.isHealthy || (plant.healthAssessment?.diseases?.length ?? 0) > 0) && (
          <div className="plant-section">
            <h3>Health Assessment</h3>
            {plant.healthAssessment?.isHealthy && (
              <p>
                <strong>Status:</strong>{' '}
                {plant.healthAssessment.isHealthy.binary ? 'Likely healthy' : 'Potential issues detected'}
                {typeof plant.healthAssessment.isHealthy.probability === 'number' && (
                  <> ({Math.round(plant.healthAssessment.isHealthy.probability * 100)}%)</>
                )}
              </p>
            )}

            {(plant.healthAssessment?.diseases?.length ?? 0) > 0 && (
              <>
                <p><strong>Top suspected issues:</strong></p>
                <ul>
                  {plant.healthAssessment!.diseases!
                    .slice(0, 3)
                    .map((d, idx) => (
                      <li key={`${d.id ?? d.name}_${idx}`}>
                        {d.name}
                        {typeof d.probability === 'number' ? ` (${Math.round(d.probability * 100)}%)` : ''}
                        {d.nonHarmful ? ' (non-harmful)' : ''}
                      </li>
                    ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Additional information */}
        {(plant.family || plant.genus) && (
          <div className="plant-section">
            <h3>Taxonomy</h3>
            {plant.family && <p><strong>Family:</strong> {plant.family}</p>}
            {plant.genus && <p><strong>Genus:</strong> {plant.genus}</p>}
          </div>
        )}

        {plant.commonNames && plant.commonNames.length > 1 && (
          <div className="plant-section">
            <h3>Common Names</h3>
            <p>{plant.commonNames.join(', ')}</p>
          </div>
        )}

        {plant.uses && (
          <div className="plant-section">
            <h3>Uses</h3>
            <p>{plant.uses}</p>
          </div>
        )}

        {plant.edibleParts && plant.edibleParts.length > 0 && (
          <div className="plant-section">
            <h3>⚠️ Edible Parts</h3>
            <p>{plant.edibleParts.join(', ')}</p>
            <p className="warning">
              <small>Always verify plant identification before consumption!</small>
            </p>
          </div>
        )}

        {/* Propagation info */}
        {plant.propagation && plant.propagation.length > 0 && (
          <div className="plant-section">
            <h3>Propagation</h3>
            <p>{plant.propagation.join(', ')}</p>
          </div>
        )}

        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="debug-info">
            <summary>Debug Information</summary>
            <pre>{JSON.stringify(plant, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default DetectedPlantInfo;
