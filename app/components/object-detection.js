"use client";
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { load as cocoSSDLoad } from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import throttle from "lodash/throttle";

const ObjectDetection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [isSongEnabled, setIsSongEnabled] = useState(false);
  const isSongEnabledRef = useRef(false); // Use a ref to track the state
  let animationFrameId;

  // Sync the ref with the state
  useEffect(() => {
    isSongEnabledRef.current = isSongEnabled;
  }, [isSongEnabled]);

  // Function to play the song (debounced manually)
  const playSong = throttle(() => {
    if (isSongEnabledRef.current) {
      const audio = new Audio("/polsaagayi.mp3");
      audio.play();
      console.log("Song played!");
    }
  }, 5000);

  // Run object detection
  const runObjectDetection = async (net) => {
    if (
      canvasRef.current &&
      webcamRef.current &&
      webcamRef.current.video?.readyState === 4
    ) {
      const video = webcamRef.current.video;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      const predictions = await net.detect(video, undefined, 0.75);

      // Check if a person is detected
      const isPersonDetected = predictions.some(
        (prediction) => prediction.class === "person"
      );
      if (isPersonDetected) playSong();

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      predictions.forEach(({ bbox, class: label, score }) => {
        const [x, y, width, height] = bbox;
        ctx.strokeStyle = score > 0.8 ? "green" : "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.font = "16px Arial";
        ctx.fillStyle = score > 0.8 ? "green" : "red";
        ctx.fillText(
          `${label} (${Math.round(score * 100)}%)`,
          x,
          y > 10 ? y - 5 : y + 15
        );
      });
    }
  };

  // Start object detection with animation frame
  const startDetection = async () => {
    setIsLoading(true);
    const net = await cocoSSDLoad();
    setIsLoading(false);

    const detect = async () => {
      await runObjectDetection(net);
      animationFrameId = requestAnimationFrame(detect);
    };
    detect();
  };

  // Toggle camera between front and back
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Toggle song playback
  const toggleSongPlayback = () => {
    setIsSongEnabled((prev) => !prev);
  };

  // Initialize TensorFlow.js backend and start detection
  useEffect(() => {
    tf.setBackend("webgl").then(() => console.log("WebGL backend set"));
    setIsClient(true);
    startDetection();

    return () => cancelAnimationFrame(animationFrameId); // Cleanup
  }, []);

  return (
    <div className="mt-8">
      {isLoading ? (
        <div className="gradient-text text-white">Loading AI Model...</div>
      ) : (
        isClient && (
          <div className="relative flex flex-col items-center gradient p-1.5 rounded-md">
            <Webcam
              ref={webcamRef}
              className="rounded-md w-full lg:h-[720px]"
              muted
              videoConstraints={{
                facingMode: facingMode,
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 z-[99999] w-full lg:h-[720px]"
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={toggleCamera}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
              >
                Switch Camera
              </button>
              <button
                onClick={toggleSongPlayback}
                className={`px-4 py-2 rounded-md ${
                  isSongEnabled
                    ? "bg-green-500 hover:bg-green-700"
                    : "bg-red-500 hover:bg-red-700"
                } text-white`}
              >
                {isSongEnabled ? "Disable Song" : "Enable Song"}
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ObjectDetection;
