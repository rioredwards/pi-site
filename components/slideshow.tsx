// "use client";

// import { useState, useEffect } from "react";
// import Image from "next/image";
// import { Button } from "@/components/ui/button";
// import { getPhoto } from "@/app/actions";

// export default function Slideshow() {
//   const [currentPhoto, setCurrentPhoto] = useState<{ src: string; alt: string } | null>(null);
//   const [isAutoPlaying, setIsAutoPlaying] = useState(true);

//   useEffect(() => {
//     // Get initial photo
//     async function fetchPhoto() {
//       const response = await getPhoto();
//       if (response.data) {
//         const newPhoto = response.data;
//         setCurrentPhoto(newPhoto);
//       } else {
//         console.error(response.error);
//       }
//     }

//     let interval: NodeJS.Timeout | null = null;

//     if (isAutoPlaying) {
//       interval = setInterval(async () => {
//         const nextPhoto = await fetchPhoto();
//         setCurrentPhoto(nextPhoto);
//       }, 3000);
//     }

//     return () => {
//       if (interval) clearInterval(interval);
//     };
//   }, [isAutoPlaying]);

//   const handleManualNext = async () => {
//     const nextPhoto = await getNextPhoto();
//     setCurrentPhoto(nextPhoto);
//   };

//   if (!currentPhoto) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="flex flex-col items-center gap-4 p-4">
//       <div className="relative w-full aspect-video max-w-3xl rounded-lg overflow-hidden border border-gray-200">
//         <Image
//           src={currentPhoto.src || "/placeholder.svg"}
//           alt={currentPhoto.alt}
//           fill
//           className="object-contain"
//           sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
//         />
//       </div>
//       <div className="flex gap-4">
//         <Button
//           onClick={() => setIsAutoPlaying(!isAutoPlaying)}
//           variant={isAutoPlaying ? "destructive" : "default"}>
//           {isAutoPlaying ? "Pause" : "Auto Play"}
//         </Button>
//         <Button onClick={handleManualNext}>Next Photo</Button>
//       </div>
//       <div className="text-sm text-muted-foreground">Current photo: {currentPhoto.alt}</div>
//     </div>
//   );
// }
