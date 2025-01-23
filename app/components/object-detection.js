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
  const [audioPlayed, setAudioPlayed] = useState(false); // To debounce audio playback
  let animationFrameId;

  // Function to play the song (debounced manually)
  const playSong = throttle(() => {
    const audio = new Audio("/polsaagayi.mp3");
    audio.play();
    console.log("Song played!");
  }, 2000);


  // Run object detection
  const runObjectDetection = async (net) => {
    if (
      canvasRef.current &&
      webcamRef.current &&
      webcamRef.current.video?.readyState === 4
    ) {
      // Match canvas to video dimensions
      const video = webcamRef.current.video;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      // Perform detection
      const predictions = await net.detect(video);
      console.log(predictions);

      // Check if a person is detected
      const isPersonDetected = predictions.some(
        (prediction) => prediction.class === "person"
      );
      if (isPersonDetected) playSong();

      // Draw bounding boxes on canvas
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      predictions.forEach(({ bbox, class: label, score }) => {
        const [x, y, width, height] = bbox;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.font = "16px Arial";
        ctx.fillStyle = "red";
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
    detect(); // Start detection loop
  };

  // Toggle camera between front and back
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
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
                facingMode: facingMode, // Dynamic facing mode
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 z-[99999] w-full lg:h-[720px]"
            />
            <button
              onClick={toggleCamera}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
            >
              Switch Camera
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default ObjectDetection;
