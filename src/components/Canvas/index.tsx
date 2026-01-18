import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Webcam from "../../helpers/WebCam";
import "./styles.css";
import DetectedPlantInfo from "../../components/DetectedPlantInfo";
import LoadingSpinner from "../common/LoadingSpinner";
import OptimizedImage from "../common/OptimizedImage";
import {
  useCurrentPlant,
  useAutoSavePreference,
  usePlantActions,
  useCameraActions,
} from "../../stores/plantStore";
import AlertBox from "../common/AlertBox";

interface CanvasProps {
  offline: boolean;
}

const Canvas: React.FC<CanvasProps> = React.memo(({ offline }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDetectedPlantInfo, setShowDetectedPlantInfo] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const currentPlant = useCurrentPlant();
  const autoSave = useAutoSavePreference();
  const { addToHistory, setCurrentPlant } = usePlantActions();
  const { setCameraActive, setCameraError } = useCameraActions();

  const webcamRef = useRef<HTMLVideoElement>(null);
  const webcam = useRef<Webcam | null>(null);

  const closeAlert = useCallback(() => {
    setAlertMessage(null);
  }, []);

  const captureImage = useCallback(async () => {
    if (!webcam.current) return;

    try {
      const capturedData = webcam.current.takeBase64Photo({
        type: "jpeg",
        quality: 0.9,
      });
      setCaptured(true);
      setCapturedImage(capturedData.base64);

      // Auto-save to history if enabled
      if (autoSave && currentPlant) {
        addToHistory(currentPlant, capturedData.base64);
      }
    } catch (error) {
      console.error("Failed to capture image:", error);
      setCameraError("Failed to capture image. Please try again.");
    }
  }, [autoSave, currentPlant, addToHistory, setCameraError]);

  const discardImage = useCallback(() => {
    setCaptured(false);
    setCapturedImage(null);
    setCurrentPlant(null);
  }, [setCurrentPlant]);

  const checkUploadStatus = useCallback(
    (data: { status: number }) => {
      setUploading(false);
      if (data.status === 200) {
        // Save to history when uploading
        if (currentPlant && capturedImage) {
          addToHistory(currentPlant, capturedImage);
        }
        setAlertMessage("Plant saved to your collection!");
        discardImage();
      } else {
        setAlertMessage("Sorry, we encountered an error saving your plant");
      }
    },
    [setUploading, discardImage, currentPlant, capturedImage, addToHistory]
  );

  const uploadImage = useCallback(() => {
    if (!capturedImage) return;

    if (offline) {
      const prefix = "cloudy_pwa_";
      const rs = Math.random().toString(36).substring(2, 5);
      localStorage.setItem(`${prefix}${rs}`, capturedImage);
      setAlertMessage(
        "Image saved locally, it will be uploaded to your library once internet connection is detected"
      );
      discardImage();
    } else {
      setUploading(true);
      // Simulating upload
      checkUploadStatus({ status: 200 });
    }
  }, [capturedImage, offline, discardImage, checkUploadStatus]);

  const findLocalItems = useCallback((query: RegExp) => {
    const results: Array<{ key: string; val: string | null }> = [];
    for (const i in localStorage) {
      if (localStorage.hasOwnProperty(i)) {
        if (i.match(query)) {
          const value = localStorage.getItem(i);
          localStorage.removeItem(i);
          results.push({ key: i, val: value });
        }
      }
    }
    return results;
  }, []);

  const imageDisplay = useMemo(
    () =>
      capturedImage ? (
        <OptimizedImage
          src={capturedImage}
          alt="captured plant"
          width="350"
          height="275"
          quality={0.7}
          loading="eager"
        />
      ) : null,
    [capturedImage]
  );

  const updateShowDetectedPlantInfo = useCallback(
    (show: boolean) => () => {
      setShowDetectedPlantInfo(show);
    },
    []
  );

  const buttons = useMemo(() => {
    return captured ? (
      <div className="button-group">
        <button className="discardButton" onClick={discardImage}>
          Discard Plant
        </button>
        <button className="captureButton" onClick={captureImage}>
          Scan Another
        </button>
        <button className="uploadButton" onClick={uploadImage}>
          💾 Save Plant
        </button>
        <button
          className="infoButton"
          onClick={updateShowDetectedPlantInfo(true)}
        >
          Show Plant Info
        </button>
      </div>
    ) : (
      <button className="captureButton" onClick={captureImage}>
        Scan Plant
      </button>
    );
  }, [
    captured,
    discardImage,
    captureImage,
    uploadImage,
    updateShowDetectedPlantInfo,
  ]);

  const uploadingMessage = useMemo(
    () =>
      uploading ? (
        <LoadingSpinner
          message="Saving plant to your collection..."
          size="small"
        />
      ) : null,
    [uploading]
  );

  useEffect(() => {
    // Initialize the camera
    const canvasElement = document.createElement("canvas");
    if (webcamRef.current) {
      webcam.current = new Webcam(webcamRef.current, canvasElement);

      webcam.current
        .setup()
        .then(() => {
          setCameraActive(true);
          setCameraError(null);
        })
        .catch((error) => {
          console.error("Camera setup failed:", error);
          setCameraError(
            "Error getting access to your camera. Please check permissions."
          );
          setCameraActive(false);
        });
    }
  }, [setCameraActive, setCameraError]);

  useEffect(() => {
    const batchUploads = () => {
      const images = findLocalItems(/^cloudy_pwa_/);
      let error = false;
      if (images.length > 0) {
        setUploading(true);
        images.forEach((image) => {
          // Simulating upload
          checkUploadStatus({ status: 200 });
        });
        setUploading(false);
        if (!error) {
          setAlertMessage(
            "All saved images have been uploaded to your Library"
          );
        }
      }
    };
    if (!offline) {
      batchUploads();
    }
  }, [offline, checkUploadStatus, findLocalItems]);

  return (
    <div className="uploadCanvas">
      <div className="mediaGroup">
        <video
          autoPlay
          playsInline
          muted
          ref={webcamRef}
          width="100vw"
          height="275"
        />
        {imageDisplay && (
          <figure className="imageCanvas">
            {imageDisplay}
            <figcaption>Image captured from feed.</figcaption>
          </figure>
        )}
      </div>
      {buttons}
      {uploadingMessage}
      {showDetectedPlantInfo && capturedImage && (
        <DetectedPlantInfo
          capturedImage={capturedImage}
          closeDialog={updateShowDetectedPlantInfo(false)}
        />
      )}
      {alertMessage && (
        <AlertBox
          type="info"
          message={alertMessage}
          onClose={closeAlert}
        />
      )}
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;
