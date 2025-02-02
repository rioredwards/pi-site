"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function EventSourceDemo() {
  const [events, setEvents] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const connectToEventSource = () => {
    // Create EventSource connection
    const source = new EventSource("/api/events");

    source.onopen = () => {
      setIsConnected(true);
      setEvents((prev) => [...prev, "Connection established"]);
    };

    source.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setEvents((prev) => [...prev, parsedData]);
      } catch (error) {
        setEvents((prev) => [...prev, `Error parsing event: ${event.data}`]);
      }
    };

    source.onerror = (error) => {
      setIsConnected(false);
      setEvents((prev) => [...prev, "Connection error"]);
      source.close();
    };

    setEventSource(source);
  };

  const disconnectEventSource = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsConnected(false);
      setEvents((prev) => [...prev, "Connection closed"]);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  return (
    <div className="container mx-auto p-4">
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
            {events.map((event, index) => (
              <div key={index} className="text-sm py-1 border-b last:border-b-0">
                {event}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
