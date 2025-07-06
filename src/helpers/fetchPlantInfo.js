import plants from "../data/plants.json";

export function fetchPlantInfo(label) {
  return plants.find((p) => p.label.toLowerCase() === label.toLowerCase());
}
