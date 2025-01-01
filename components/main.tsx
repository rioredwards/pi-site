"use client"

import { useEffect, useState } from 'react'
import BounceLoader from 'react-spinners/BounceLoader'
import { deletePhoto as deletePhotoFile, getPhotos } from '../app/actions'
import { PhotoUpload } from '../components/photo-upload'
import { ImgCard } from '../components/ui/imgCard'
import { useCookie } from '../context/CookieCtx'
import { useToast } from '../hooks/use-toast'
import { Photo } from '../lib/types'

export function Main() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const { toast } = useToast()
  const { cookie } = useCookie()

  useEffect(() => {
    async function fetchPhotos() {
      const response = await getPhotos()
      if (response.data) {
        // Sort photos by id in descending order
        response.data.sort((a, b) => b.order - a.order)
        setPhotos(response.data)
      } else {
        console.error(response.error)
      }
    }
    fetchPhotos()
  }, [])

  function addPhoto(photo: Photo) {
    setPhotos((prevPhotos) => [photo, ...prevPhotos])
  }

  async function deletePhoto(id: string) {
    if (!cookie) {
      toast({
        title: "Error",
        description: "You must enable cookies to delete a photo.",
        variant: "destructive",
      })
      return;
    }
    const targetPhoto = photos.find((photo) => photo.id === id) as Photo;
    if (cookie !== targetPhoto.sessionId && cookie !== "admin") {
      toast({
        title: "Error",
        description: "You can only delete your own photos.",
        variant: "destructive",
      })
      return;
    }
    const res = await deletePhotoFile(id, targetPhoto.imgFilename)
    if (res.error) {
      console.error(res.error)
      toast({
        title: "Error",
        description: "There was a problem deleting your photo.",
        variant: "destructive",
      })
      return;
    }
    setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== id))
    toast({
      title: "Success",
      description: "Your photo has been deleted.",
    })
  }

  return (
    <div className="container px-4 py-8 mx-auto min-h-96">
      <PhotoUpload addPhoto={addPhoto} />
      {!photos.length && (<div className='mt-24 flex justify-center items-center'><BounceLoader color={"rgb(15, 220, 220)"} loading={true} size={25} /></div>)}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <ImgCard
            id={photo.id}
            src={photo.src}
            alt={photo.alt}
            key={photo.id}
            sessionId={photo.sessionId}
            deletePhoto={deletePhoto}
          />
        ))}
      </div>
    </div>
  )
}
