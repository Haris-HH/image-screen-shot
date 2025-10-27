import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

interface MediaDeviceInfoWithLabel extends MediaDeviceInfo {
  label: string;
}

const WebcamCapture: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [devices, setDevices] = useState<MediaDeviceInfoWithLabel[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // 🔍 List available video input devices
  const handleDevices = useCallback((mediaDevices: MediaDeviceInfo[]) => {
    const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
    setDevices(videoDevices as MediaDeviceInfoWithLabel[]);
    if (videoDevices.length > 0 && !deviceId) {
      setDeviceId(videoDevices[0].deviceId);
    }
  }, [deviceId]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  // 📸 Capture image
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    } else {
      console.warn("getScreenshot() returned null");
    }
  }, []);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!isMobile) {
    return <p>Camera access is only allowed on mobile devices.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="flex gap-2 items-center">
        <label htmlFor="cameraSelect">Select camera:</label>
        <select
          id="cameraSelect"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        >
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>
      </div>

      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{ deviceId: deviceId ? { exact: deviceId } : undefined, facingMode: "environment"}}
        style={{ width: 400, borderRadius: 8 }}
      />

      <button onClick={capture}>Capture</button>

      {imgSrc && (
        <div className="mt-4">
          <h3>Preview:</h3>
          <img src={imgSrc} alt="Captured" width={400} />
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
