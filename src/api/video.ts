import { execa, execaCommand } from 'execa'
import { join } from 'path'

import { config } from '~/config.js'

interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  hasAudio: boolean
  frames: number
}

export async function getVideoMetadata (inputFile: string): Promise<VideoMetadata> {
  const options: string = '-v error -show_entries format=duration:stream=width,height,r_frame_rate,codec_type,nb_frames -of json'

  const { stdout } = await execaCommand(`${config.FFPROBE} -i ${inputFile} ${options}`)
  const { format: { duration }, streams } = JSON.parse(stdout)

  const hasAudio = streams.some((str: { codec_type: string }) => str.codec_type === 'audio')
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { width, height, r_frame_rate, nb_frames: frames } = streams.find((str: { codec_type: string }) => str.codec_type === 'video')

  const [fpsNumerator, fpsDenominator] = r_frame_rate.split('/').map(Number)
  const fps = Math.floor(fpsNumerator / fpsDenominator)

  return { duration, width, height, fps, hasAudio, frames }
}

export const frameFormat = '%04d.bmp'

export async function extractFrames (inputFile: string, outDir: string) {
  const args = [
    '-i', inputFile,
    '-threads', '4',
    '-vf', 'scale=\'if(lte(ih,iw), 512, -2)\':\'if(lte(iw,ih), 512, -2)\'',
    '-pix_fmt', 'yuv420p',
    '-y',
    join(outDir, frameFormat)
  ]

  await execa(config.FFMPEG, args, { encoding: null })
}
