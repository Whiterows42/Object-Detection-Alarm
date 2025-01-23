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
  const [facingMode, setFacingMode] = useState("user"); // Default to front camera
  let detectInterval;

  const playSong = throttle(() => {
    const audio = new Audio("/polsaagayi.mp3");
    audio.play();
    console.log("Song played!");
  }, 2000);

  async function runObjectDetection(net) {
    if (
      canvasRef.current &&
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4
    ) {
      canvasRef.current.width = webcamRef.current.video.videoWidth;
      canvasRef.current.height = webcamRef.current.video.videoHeight;

      const predictions = await net.detect(
        webcamRef.current.video,
        undefined,
        0.6
      );
      console.log(predictions);

      const isPersonDetected = predictions.some(
        (prediction) => prediction.class === "person"
      );

      if (isPersonDetected) {
        playSong();
      }

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      predictions.forEach((prediction) => {
        const [x, y, width, height] = prediction.bbox;
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = "#FF0000";
        ctx.font = "12px Arial";
        ctx.fillText(
          `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
          x,
          y > 10 ? y - 5 : y + 10
        );
      });
    }
  }

  const runCoco = async () => {
    setIsLoading(true);
    const net = await cocoSSDLoad();
    setIsLoading(false);

    detectInterval = setInterval(() => {
      runObjectDetection(net);
    }, 10);
  };

  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  useEffect(() => {
    setIsClient(true);
    runCoco();

    return () => {
      if (detectInterval) {
        clearInterval(detectInterval);
      }
    };
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
