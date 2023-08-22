import fs from '@supercharge/fs'
import { join, parse, resolve } from 'path'

export const resourcesPath = resolve('./resources')
export const templatePath = join(resourcesPath, 'templates')

const fontPath = join(resourcesPath, 'fonts')

function parseFontFolder (files: string[], subfolder?: string) {
  return files
    .filter(file => file.endsWith('.ttf'))
    .map(file => {
      const path = resolve(join(fontPath, subfolder == null ? file : join(subfolder, file)))
      const { name } = parse(path)
      return { path, name }
    })
}

export const fonts = parseFontFolder(await fs.files(fontPath))
export const fallbackFonts = parseFontFolder(await fs.files(join(fontPath, 'fallback')), 'fallback')
export const emojiFonts = parseFontFolder(await fs.files(join(fontPath, 'emoji')), 'emoji')
