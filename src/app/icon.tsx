import { promises as fs } from 'node:fs'
import path from 'node:path'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/jpeg'

export default async function Icon() {
  const filePath = path.join(process.cwd(), 'public/assets/logo_surgsoc.jpg')
  const data = await fs.readFile(filePath)

  return new Response(data, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
