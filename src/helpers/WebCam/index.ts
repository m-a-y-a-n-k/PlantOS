class Webcam {
  webcamElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;

  constructor(webcamElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.webcamElement = webcamElement;
    this.canvasElement = canvasElement;
  }

  adjustVideoSize = (width: number, height: number) => {
    const aspectRatio = width / height;
    if (width >= height) {
      this.webcamElement.width = aspectRatio * this.webcamElement.height;
    } else {
      this.webcamElement.height = this.webcamElement.width / aspectRatio;
    }
  };

  setup = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (navigator.mediaDevices.getUserMedia !== undefined) {
        navigator.mediaDevices
          .getUserMedia({
            audio: false,
            video: { facingMode: "environment" },
          })
          .then((mediaStream) => {
            if ("srcObject" in this.webcamElement) {
              this.webcamElement.srcObject = mediaStream;
            } else {
              // For older browsers without the srcObject.
              (this.webcamElement as any).src = (window.URL as any).createObjectURL(mediaStream);
            }
            this.webcamElement.addEventListener(
              "loadeddata",
              async () => {
                this.adjustVideoSize(
                  this.webcamElement.videoWidth,
                  this.webcamElement.videoHeight
                );
                resolve();
              },
              false
            );
          });
      } else {
        reject();
      }
    });
  };

  _drawImage = () => {
    const imageWidth = this.webcamElement.videoWidth;
    const imageHeight = this.webcamElement.videoHeight;

    const context = this.canvasElement.getContext("2d");
    if (!context) {
      throw new Error("Could not get 2D context from canvas");
    }
    
    this.canvasElement.width = imageWidth;
    this.canvasElement.height = imageHeight;

    context.drawImage(this.webcamElement, 0, 0, imageWidth, imageHeight);
    return { imageHeight, imageWidth };
  };

  takeBlobPhoto = (): Promise<{ blob: Blob | null; imageHeight: number; imageWidth: number }> => {
    const { imageWidth, imageHeight } = this._drawImage();
    return new Promise((resolve, reject) => {
      this.canvasElement.toBlob((blob) => {
        resolve({ blob, imageHeight, imageWidth });
      });
    });
  };

  takeBase64Photo = ({ type, quality }: { type?: string; quality?: number } = { type: "png", quality: 1 }): { base64: string; imageHeight: number; imageWidth: number } => {
    const { imageHeight, imageWidth } = this._drawImage();
    const base64 = this.canvasElement.toDataURL("image/" + type, quality);
    return { base64, imageHeight, imageWidth };
  };
}

export default Webcam;
