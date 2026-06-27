import { readdir } from 'node:fs/promises'
import { join, parse, resolve } from 'node:path'
import { GlobalFonts, type Image, loadImage } from '@napi-rs/canvas'

import type { Logger } from '@/platform/logger'

export interface FontResource {
	path: string
	/** Font family name used in canvas `ctx.font` (e.g. `times`, `lobster`). */
	name: string
}

export interface Templates {
	watermark: Image
	balloon: Image
	demotivator: Image
	circleDemotivator: Image
	demotivatorWatermark: Image
	circleDemotivatorWatermark: Image
}

export interface Resources {
	resourcesPath: string
	templatePath: string
	boomFolder: string
	fonts: FontResource[]
	fallbackFonts: FontResource[]
	emojiFonts: FontResource[]
	/** Comma-joined fallback family names, ready to append to a `ctx.font` stack. */
	fallbackStack: string
	templates: Templates
}

async function parseFontFolder(dir: string): Promise<FontResource[]> {
	let files: string[]
	try {
		files = await readdir(dir)
	} catch {
		return []
	}
	return files
		.filter(file => file.endsWith('.ttf'))
		.map(file => {
			const path = join(dir, file)
			const { name } = parse(path)
			return { path, name }
		})
}

/**
 * Load fonts + template images once at startup.
 *
 * Fonts are registered with `@napi-rs/canvas` `GlobalFonts` (confirmed working
 * on Bun) so the family names referenced by text options (`times`, `lobster`,
 * `impact`, …) resolve during canvas rendering. Templates are decoded up front
 * because every demotivator/balloon call composites them.
 *
 * No global singletons: callers own the returned object and pass it through the
 * generation context.
 */
export async function createResources(opts: {
	logger: Logger
	resourcesDir?: string
}): Promise<Resources> {
	const log = opts.logger.named('resources')
	const resourcesPath = resolve(opts.resourcesDir ?? 'resources')
	const templatePath = join(resourcesPath, 'templates')
	const fontPath = join(resourcesPath, 'fonts')

	const [fonts, fallbackFonts, emojiFonts] = await Promise.all([
		parseFontFolder(fontPath),
		parseFontFolder(join(fontPath, 'fallback')),
		parseFontFolder(join(fontPath, 'emoji')),
	])

	for (const f of [...fonts, ...fallbackFonts, ...emojiFonts]) {
		GlobalFonts.registerFromPath(f.path, f.name)
		log.debug({ name: f.name, path: f.path }, 'registered font')
	}

	const tpl = (name: string) => loadImage(join(templatePath, name))
	const [
		watermark,
		balloon,
		demotivator,
		circleDemotivator,
		demotivatorWatermark,
		circleDemotivatorWatermark,
	] = await Promise.all([
		tpl('watermark.png'),
		tpl('balloon.png'),
		tpl('demotivator.png'),
		tpl('circle_demotivator.png'),
		tpl('demotivator_watermark.png'),
		tpl('circle_demotivator_watermark.png'),
	])

	return {
		resourcesPath,
		templatePath,
		boomFolder: join(templatePath, 'boom'),
		fonts,
		fallbackFonts,
		emojiFonts,
		fallbackStack: fallbackFonts.map(f => f.name).join(','),
		templates: {
			watermark,
			balloon,
			demotivator,
			circleDemotivator,
			demotivatorWatermark,
			circleDemotivatorWatermark,
		},
	}
}
