import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { uploadPhoto } from '../app/actions'
import { Photo } from '../lib/types'

interface Props {
  addPhoto: (photo: Photo) => void
}

export function PhotoUpload({ addPhoto }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a photo to upload.",
        variant: "destructive",
      })
      return;
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = await uploadPhoto(formData)
    if (res.error || !res.data) {
      console.error(res.error)
      toast({
        title: "Error",
        description: "There was a problem uploading your photo.",
        variant: "destructive",
      })
      return;
    }

    toast({
      title: "Success",
      description: "Your photo has been uploaded.",
    })
    setFile(null)
    addPhoto(res.data)
  }

  const handleCancel = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className='flex flex-col items-center justify-center mb-4'>
      <form onSubmit={handleSubmit} className={"w-80 p-4 flex flex-col justify-center items-center rounded-lg" + (file ? " border border-blue-200 hover:shadow-sm" : "")}>
        {!file && <Label htmlFor="photo" className={(file ? "hidden" : "") + " cursor-pointer text-center w-48 h-12 bg-gray-200 rounded-lg flex items-center justify-center"}>
          Upload a dog photo</Label>}
        {file &&
          <>
            <p className="text-center mb-4">Upload this dog?</p>
            <Label htmlFor="photo"
              className="w-48 h-48 mb-4 relative aspect-square overflow-hidden rounded-lg cursor-pointer"
            ><Image
                src={URL.createObjectURL(file)}
                alt="Dog photo"
                width={192}
                height={192}
                className="object-contain" />
            </Label></>}
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          ref={fileInputRef}
        />
        {file && <div className="flex space-x-2 w-full">
          <Button onClick={handleCancel} variant="outline" className='bg-gray-100 hover:bg-gray-200 flex-1'>
            Cancel
          </Button>
          <Button type="submit" variant="default" className='bg-cyan-400 hover:bg-cyan-500 flex-1'>
            Upload
          </Button>
        </div>}
      </form>
    </section>
  )
}

