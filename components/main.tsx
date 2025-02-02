"use client";
import { lazy, useState } from "react";
import { Photo } from "../lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ImgCard } from "./ui/imgCard";

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
        if (!parsedData) {
          throw new Error("No photo data found in event");
        }
        setPhoto(parsedData);
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

  // useEffect(() => {
  //   async function fetchPhoto() {
  //     const response = await getPhoto();
  //     if (response.data) {
  //       const newPhoto = response.data;
  //       setPhoto(newPhoto);
  //     } else {
  //       console.error(response.error);
  //       toast({
  //         title: "Error",
  //         description: "There was a problem fetching photos. Try reloading the page.",
  //         variant: "destructive",
  //       });
  //     }
  //   }
  //   fetchPhoto();
  // }, [toast]);

  return (
    <div className="container px-4 py-8 mx-auto min-h-96">
      <Card>
        <CardHeader>
          <CardTitle>Server-Sent Events Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button onClick={connectToEventSource} disabled={isConnected}>
              Connect
            </Button>
            <Button onClick={disconnectEventSource} disabled={!isConnected} variant="destructive">
              Disconnect
            </Button>
          </div>

          <div className="border rounded p-4 max-h-64 overflow-y-auto">
            <h3 className="font-bold mb-2">Event Log:</h3>
            {photo && <ImgCard src={photo.src} alt={photo.alt} key={photo.id} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
