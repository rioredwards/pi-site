"use client"

import { useEffect, useState } from 'react'
import { deletePhoto as deletePhotoFile, getPhotos } from '../app/actions'
import { PhotoUpload } from '../components/photo-upload'
import { ImgCard } from '../components/ui/imgCard'
import { Photo } from '../lib/types'

export function Main() {
  const [photos, setPhotos] = useState<Photo[]>([])

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
    const targetPhoto = photos.find((photo) => photo.id === id) as Photo;
    console.log("Delete photo: ", targetPhoto)
    const res = await deletePhotoFile(id, targetPhoto.imgFilename)
    if (res.error) {
      console.error(res.error)
      return
    }
    setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== id))
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <PhotoUpload addPhoto={addPhoto} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <ImgCard
            id={photo.order}
            src={photo.src}
            alt={photo.alt}
            key={photo.id}
            deletePhoto={deletePhoto}
          />
        ))}
      </div>
    </div>
  )
}
