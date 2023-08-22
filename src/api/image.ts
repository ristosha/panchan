import { execaCommand } from 'execa'

import { config } from '~/config.js'

export interface PhotoDimensions {
  width: number
  height: number
}

export async function getPhotoDimensions (inputFile: string): Promise<PhotoDimensions> {
  const options: string = 'identify -format %w:%h'
  const { stdout } = await execaCommand(`${config.IMAGE_MAGICK} ${options} ${inputFile}`)
  const [width, height] = stdout.trim().split(':').map(Number)
  return { width, height }
}
