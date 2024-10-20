import React, { useEffect, useState, useRef, useCallback } from "react";
import Webcam from "../../helpers/WebCam";
import "./styles.css";

const Canvas = ({ offline }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [captured, setCaptured] = useState(false);
  const [uploading, setUploading] = useState(false);

  const webcamRef = useRef(null);
  const webcam = useRef(null);

  const captureImage = async () => {
    const capturedData = webcam.current.takeBase64Photo({
      type: "jpeg",
      quality: 0.8,
    });
    setCaptured(true);
    setCapturedImage(capturedData.base64);
  };
  const discardImage = useCallback(() => {
    setCaptured(false);
    setCapturedImage(null);
  }, []);

  const checkUploadStatus = useCallback(
    (data) => {

      setUploading(false);
      if (data.status === 200) {
        alert("Image Uploaded to Library");
        discardImage();
      } else {
        alert("Sorry, we encountered an error uploading your image");
      }
    },
    [setUploading, discardImage]
  );

  const uploadImage = () => {
    if (offline) {
      const prefix = "cloudy_pwa_";
      const rs = Math.random().toString(36).substring(2, 5);
      localStorage.setItem(`${prefix}${rs}`, capturedImage);
      alert(
        "Image saved locally, it will be uploaded to your library once internet connection is detected"
      );
      discardImage();
    } else {
      setUploading(true);
      // Simulating upload
      checkUploadStatus({ status: 200 });
    }
  };

  const findLocalItems = (query) => {
    let results = [];
    for (let i in localStorage) {
      if (localStorage.hasOwnProperty(i)) {
        if (i.match(query) || (!query && typeof i === "string")) {
          const value = localStorage.getItem(i);
          results.push({ key: i, val: value });
        }
      }
    }
    return results;
  };

  const imageDisplay = capturedImage ? (
    <img src={capturedImage} alt="captured" width="350" />
  ) : (
    <span />
  );

  const buttons = captured ? (
    <div>
      <button className="deleteButton" onClick={discardImage}>
        Delete Photo
      </button>
      <button className="captureButton" onClick={uploadImage}>
        Upload Photo
      </button>
    </div>
  ) : (
    <button className="captureButton" onClick={captureImage}>
      Take Picture
    </button>
  );

  const uploadingMessage = uploading ? (
    <div>
      <p>Uploading Image, please wait ...</p>
    </div>
  ) : (
    <span />
  );

  useEffect(() => {
    // Initialize the camera
    const canvasElement = document.createElement("canvas");
    webcam.current = new Webcam(webcamRef.current, canvasElement);

    webcam.current.setup().catch(() => {
      alert("Error getting access to your camera");
    });
  }, []);

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
          alert("All saved images have been uploaded to your Library");
        }
      }
    };
    if (!offline) {
      batchUploads();
    }
  }, [offline, checkUploadStatus]);

  return (
    <div>
      {uploadingMessage}
      <video
        autoPlay
        playsInline
        muted
        ref={webcamRef}
        width="100%"
        height="200"
      />
      <br />
      <div className="imageCanvas">{imageDisplay}</div>
      {buttons}
    </div>
  );
};

export default Canvas;
