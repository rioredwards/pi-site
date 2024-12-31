"use client"

import { useEffect, useState } from 'react'
import { getPhotos } from '../app/actions'
import { PhotoUpload } from '../components/photo-upload'
import { ImgCard } from '../components/ui/imgCard'
import { Photo } from '../lib/types'

export function Main() {
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    async function fetchPhotos() {
      const photos = await getPhotos()
      setPhotos(photos)
    }
    fetchPhotos()
  }, [])

  function addPhoto(photo: Photo) {
    setPhotos((prevPhotos) => [photo, ...prevPhotos])
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <PhotoUpload addPhoto={addPhoto} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <ImgCard {...photo} key={photo.id} />
        ))}
      </div>
    </div>
  )
}
