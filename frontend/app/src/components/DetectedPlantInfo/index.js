import { useEffect, useState } from "react";
import usePlantDetector from "../../helpers/plantDetector";
import "./styles.css";

function DetectedPlantInfo({ capturedImage, closeDialog }) {
  const { detect, ready, classifier } = usePlantDetector(capturedImage);
  const [plant, setPlant] = useState(null);

  useEffect(() => {
    if (ready) {
      (async () => {
        const results = await detect(capturedImage, classifier);
        if (results.length > 0) {
          let mostConfidentResult = null;
          results.forEach((result) => {
            if (!mostConfidentResult) {
              mostConfidentResult = result;
            } else if (mostConfidentResult.confidence < result.confidence) {
              mostConfidentResult = result;
            }
          });
          setPlant(mostConfidentResult);
        }
      })();
    }
  }, [ready, capturedImage, detect, classifier]);

  if (!plant) {
    return null;
  }

  return (
    <div className="plant-info-dialog">
      <div className="plant-info-card">
        <span className="plant-info-dialog-close" onClick={closeDialog}>
          X
        </span>
        <h2 className="plant-name">{plant.label}</h2>
        {plant.scientificName && (
          <p className="plant-scientific">({plant.scientificName})</p>
        )}
        {plant.description && (
          <p className="plant-description">{plant.description}</p>
        )}
        {plant.confidence && (
          <p className="plant-confidence">
            Confidence: {Math.round(plant.confidence * 100)}%
          </p>
        )}
        {plant.image && (
          <img
            className="plant-image"
            src={plant.image}
            alt={plant.commonName}
          />
        )}
      </div>
    </div>
  );
}

export default DetectedPlantInfo;
