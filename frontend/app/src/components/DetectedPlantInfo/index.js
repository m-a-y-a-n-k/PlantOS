import React from "react";
import "./styles.css";

function DetectedPlantInfo({ plant, closeDialog }) {
  if (!plant) return null;

  return (
    <div className="plant-info-dialog">
      <div className="plant-info-card">
        <span className="plant-info-dialog-close" onClick={closeDialog}>
          X
        </span>
        <h2 className="plant-name">{plant.commonName}</h2>
        <p className="plant-scientific">({plant.scientificName})</p>
        <p className="plant-description">{plant.description}</p>

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
