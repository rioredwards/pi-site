"use client";
import Image from "next/image";
import { lazy, useState } from "react";
import { Photo } from "../lib/types";
import { Button } from "./ui/button";

export const PhotoUpload = lazy(() => import("@/components/photo-upload"));

export function Main() {
  const [photo, setPhoto] = useState<Photo | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const connectToEventSource = () => {
    // Create EventSource connection
    const source = new EventSource("/api/slideshow");

    source.onopen = () => {
      setIsConnected(true);
    };

    source.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        console.log("parsedData: ", parsedData);
        if (parsedData.photo) {
          setPhoto(parsedData.photo);
        } else {
          console.log(`Error parsing event: ${event.data}`);
        }
      } catch (error) {
        console.error(`Error parsing event: ${event.data}`);
        console.error(error);
      }
    };

    source.onerror = (error) => {
      setIsConnected(false);

      console.error("Connection error");
      console.error(error);

      source.close();
    };

    setEventSource(source);
  };

  const disconnectEventSource = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsConnected(false);

      console.log("Connection closed");
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 flex items-center justify-center">
      {photo && (
        <Image
          src={photo.src}
          alt={photo.alt}
          key={photo.id}
          layout="fill"
          objectFit="contain"
          className="object-cover min-w-full min-h-full"
        />
      )}
      <div className="absolute bottom-4 left-4 flex gap-4">
        <Button onClick={connectToEventSource} disabled={isConnected} className="bg-green-900">
          Start
        </Button>
        <Button onClick={disconnectEventSource} disabled={!isConnected}>
          Stop
        </Button>
      </div>
    </div>
  );
}
