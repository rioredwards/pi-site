import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'DogTown - A community gallery for dog photos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const [logoData, comfortaaFont] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'logo.png'), 'base64'),
    readFile(join(process.cwd(), 'public', 'fonts', 'Comfortaa-Bold.ttf')),
  ])
  const logoSrc = `data:image/png;base64,${logoData}`

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f5e6d3 0%, #fff8f0 50%, #f5e6d3 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src={logoSrc} alt="DogTown" width={150} height={150} style={{ marginBottom: 24 }} />

        <div
          style={{
            fontSize: 80,
            fontFamily: 'Fredoka One',
            color: '#3d2814',
            marginBottom: 16,
          }}
        >
          DogTown
        </div>

        <div
          style={{
            fontSize: 32,
            color: '#6b5344',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Come on down to DogTown!
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Comfortaa',
          data: comfortaaFont,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  )
}
