import { useEffect, useState } from 'react';
/* global ml5 */

async function detect(base64, classifier) {
    const img = new Image();
    img.src = base64;
    await img.decode();
    return await classifier.classify(img);
  }

export default function usePlantDetector() {
  const [classifier, setClassifier] = useState(null);

  useEffect(() => {
    setClassifier(ml5.imageClassifier("MobileNet"));
  }, []);

  return { detect, ready: !!classifier, classifier };
}