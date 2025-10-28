import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

interface MediaDeviceInfoWithLabel extends MediaDeviceInfo {
  label: string;
}

const WebcamCapture: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfoWithLabel[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  // 🔍 List available cameras
  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) => {
      const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
      setDevices(videoDevices as MediaDeviceInfoWithLabel[]);
      if (videoDevices.length > 0 && !deviceId) {
        setDeviceId(videoDevices[0].deviceId);
      }
    },
    [deviceId]
  );

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  // 📍 Get current geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => console.warn("Geolocation error:", err.message),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // 📸 Capture image + overlay text
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      console.warn("getScreenshot() returned null");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const image = new Image();

    image.onload = () => {
      // Set canvas size to match image
      canvas.width = image.width;
      canvas.height = image.height;

      // Draw image
      ctx?.drawImage(image, 0, 0, image.width, image.height);

      // Prepare overlay text
      const timestamp = new Date().toLocaleString();
      const lat = location ? location.lat.toFixed(5) : "Unknown";
      const lon = location ? location.lon.toFixed(5) : "Unknown";

      const overlayText = `${lat}, ${lon}\n${timestamp}`;

      // Style and draw text
      if (ctx) {
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;

        const lines = overlayText.split("\n");
        let y = image.height - 50;

        lines.forEach((line) => {
          ctx.strokeText(line, 20, y);
          ctx.fillText(line, 20, y);
          y += 25;
        });
      }

      // Export final image
      const finalImage = canvas.toDataURL("image/jpeg");
      setImgSrc(finalImage);
    };

    image.src = imageSrc;
  }, [location]);

  // 🚫 Allow only mobile devices
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
        videoConstraints={{
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: "environment",
        }}
        style={{ width: 400, borderRadius: 8 }}
      />

      <button
        onClick={capture}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Capture
      </button>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {imgSrc && (
        <div className="mt-4 text-center">
          <h3>Preview with Info:</h3>
          <img src={imgSrc} alt="Captured" width={400} />
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
