
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useRef, useState } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';
import { uploadPhoto } from '../app/actions';
import { useCookie } from '../context/CookieCtx';
import { reduceFileSize } from '../lib/imgCompress';
import { Photo } from '../lib/types';

interface Props {
  addPhoto: (photo: Photo) => void
}

export function PhotoUpload({ addPhoto }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { cookie } = useCookie()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true)

    if (!cookie) {
      toast({
        title: "Error",
        description: "You must enable cookies to upload a photo.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return;
    }

    if (!file) {
      toast({
        title: "Error",
        description: "Please select a photo to upload.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return;
    }

    const formData = new FormData()

    // If file size > 500kB, resize such that width <= 1000, quality = 0.9
    const MAX_FILE_SIZE = 500 * 1000; // 500kB
    const MAX_WIDTH = 1000; // 1000px
    const MAX_HEIGHT = 1000; // 1000px
    const QUALITY = 0.9; // 90%

    const resizedImg = await reduceFileSize(file, MAX_FILE_SIZE, MAX_WIDTH, MAX_HEIGHT, QUALITY);

    formData.append('file', resizedImg)

    const res = await uploadPhoto(formData)
    if (res.error || !res.data) {
      console.error(res.error)
      toast({
        title: "Error",
        description: "There was a problem uploading your photo.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return;
    }

    toast({
      title: "Success",
      description: "Your photo has been uploaded.",
    })
    setFile(null)
    setIsSubmitting(false)
    addPhoto(res.data)
  }

  const handleCancel = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className='flex flex-col items-center justify-center mb-8'>
      <form onSubmit={handleSubmit} className={"rounded-2xl" + (file ? " gradient-card-wrapper w-[400px] h-[400px] hover:shadow-sm" : "")}>
        <div className={'flex flex-col justify-center items-center h-full w-full' + (file ? " gradient-card-content rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 px-12" : "")}>
          {!file && <div className='gradient-btn-wrapper rounded-full w-[300px] h-[75px]'>
            <Label htmlFor="photo" className={(file ? "hidden" : "") + " gradient-btn-content rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 cursor-pointer text-center flex items-center justify-center font-bold transition"}>
              Upload Your Dog <span className='text-2xl ml-2'> 🐶</span> </Label>
          </div>}
          {file &&
            <>
              <p className="text-center mb-2 font-bold text-lg">Upload this Dog?</p>
              <div className='h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6' />
              <Label htmlFor="photo"
                className="w-48 h-48 mb-8 relative aspect-square overflow-hidden rounded-lg cursor-pointer"
              ><Image
                  src={URL.createObjectURL(file)}
                  alt="Dog photo"
                  width={0}
                  height={0}
                  fill={true}
                  className="object-cover"
                />
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
            <Button onClick={handleCancel} variant="outline" className='bg-gray-200 hover:bg-gray-300 flex-1 transition'>
              Cancel
            </Button>
            <Button type="submit"
              disabled={isSubmitting}
              variant="default" className='text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium flex-1 transition'>
              {!isSubmitting ? "Upload" : <>
                <PulseLoader color="white" loading={true} size={5} />
              </>}
            </Button>
            {/* <button type="button" class="text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Purple to Pink</button> */}
          </div>}
        </div>
      </form>
    </section>
  )
}

