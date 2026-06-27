import type { Repositories } from '@/repositories'

// Cache of the default pack ids, connected to every newly-seen chat. The legacy
// code held this in a module-level `packs.defaultPacks` populated once at boot
// and refreshed by the /set_default admin command. Same idea, lazily filled.
let cache: number[] | null = null

export async function getDefaultPackIds(repos: Repositories): Promise<number[]> {
	if (cache != null) return cache
	cache = (await repos.packs.getDefaultIds()).map(p => p.id)
	return cache
}

export async function refreshDefaultPackIds(repos: Repositories): Promise<number[]> {
	cache = (await repos.packs.getDefaultIds()).map(p => p.id)
	return cache
}
