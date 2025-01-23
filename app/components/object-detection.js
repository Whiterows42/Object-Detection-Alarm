"use client";
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { load as cocoSSDLoad } from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import throttle from "lodash/throttle"; // Import throttle from lodash

const ObjectDetection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isClient, setIsClient] = useState(false); // State to track client-side rendering
  const [isLoading, setIsLoading] = useState(false); // State to track model loading
  let detectInterval;

  // Function to play song (throttled)
  const playSong = throttle(() => {
    // const audio = new Audio("/polsaagayi.mp3"); // Replace with the path to your song
    // audio.play();
    console.log("Song played!");
  }, 2000); // Throttle to play the song once every 5 seconds

  async function runObjectDetection(net) {
    if (
      canvasRef.current &&
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4
    ) {
      canvasRef.current.width = webcamRef.current.video.videoWidth;
      canvasRef.current.height = webcamRef.current.video.videoHeight;

      // Perform object detection using the COCO-SSD model
      const predictions = await net.detect(webcamRef.current.video, undefined, 0.6);

      console.log(predictions);

      // Check if a person is detected
      const isPersonDetected = predictions.some(
        (prediction) => prediction.class === "person"
      );

      // Play song if a person is detected
      if (isPersonDetected) {
        playSong();
      }

      // Draw predictions on the canvas
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

  const showVideo = () => {
    if (webcamRef.current !== null && webcamRef.current.video?.readyState === 4) {
      const myVideoWidth = webcamRef.current.video.videoWidth;
      const myVideoHeight = webcamRef.current.video.videoHeight;
      console.log(`Video dimensions: ${myVideoWidth}x${myVideoHeight}`);
    }
  };

  const runCoco = async () => {
    setIsLoading(true);
    const net = await cocoSSDLoad();
    setIsLoading(false);

    detectInterval = setInterval(() => {
      runObjectDetection(net);
    }, 10);
  };

  useEffect(() => {
    setIsClient(true); // Set isClient to true on the client side
    runCoco();
    showVideo();

    return () => {
      if (detectInterval) {
        clearInterval(detectInterval); // Cleanup interval on unmount
      }
    };
  }, []);

  return (
    <div className="mt-8">
      {isLoading ? (
        <div className="gradient-text text-white">Loading AI Model...</div>
      ) : (
        isClient && (
          <div className="relative flex justify-center items-center gradient p-1.5 rounded-md">
            <Webcam
              ref={webcamRef}
              className="rounded-md w-full lg:h-[720px]"
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 z-[99999] w-full lg:h-[720px]"
            />
          </div>
        )
      )}
    </div>
  );
};

export default ObjectDetection;