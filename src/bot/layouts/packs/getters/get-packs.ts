import { type PackType } from '@prisma/client'

import { storage } from '~/storage.js'

export async function getOwnPacks (type: PackType, userId: number) {
  const packs = await storage.pack.findMany({
    where: {
      type,
      OR: [
        { authorId: userId },
        { editors: { some: { id: userId } } }
      ]
    },
    select: { id: true, name: true, default: true, tags: true }
  })
  return packs
}

export async function getOwnPackById (id: number, userId: number) {
  const packs = await storage.pack.findFirst({
    where: {
      id,
      OR: [
        { authorId: userId },
        { editors: { some: { id: userId } } }
      ]
    },
    include: {
      editors: { select: { id: true, username: true, anonymous: true, telegramId: true } },
      author: { select: { id: true, username: true, anonymous: true } },
      _count: { select: { usedInChats: true, elements: true } }
    }
  })
  return packs
}

export async function countOwnPackElementsById (id: number, userId: number) {
  const count = await storage.packElement.count({
    where: {
      pack: {
        id,
        OR: [
          { authorId: userId },
          { editors: { some: { id: userId } } }
        ]
      }
    }
  })
  return count
}

export async function getOwnPackElementsById (id: number, userId: number, take = 10, skip = 0) {
  const packs = await storage.packElement.findMany({
    where: {
      pack: {
        id,
        OR: [
          { authorId: userId },
          { editors: { some: { id: userId } } }
        ]
      }
    },
    select: {
      id: true,
      type: true,
      content: true,
      _count: { select: { usedInMedia: true } },
      author: { select: { id: true, username: true, anonymous: true } }
    },
    take,
    skip
  })
  return packs
}

export async function getOwnElementById (id: number, userId: number) {
  const element = await storage.packElement.findFirst({
    where: {
      id,
      pack: {
        OR: [
          { authorId: userId },
          { editors: { some: { id: userId } } }
        ]
      }
    },
    include: {
      pack: { include: { editors: true } },
      author: { select: { id: true, username: true, anonymous: true } },
      _count: { select: { usedInMedia: true } }
    }
  })

  return element
}

export async function getPublicPacks (type: PackType) {
  const packs = await storage.pack.findMany({
    where: {
      type,
      OR: [
        { default: true },
        { private: false }
      ]
    },
    orderBy: {
      usedInChats: {
        _count: 'desc'
      }
    },
    select: { id: true, name: true, default: true, tags: true }
  })
  return packs
}

export async function getPublicPackById (id: number) {
  const packs = await storage.pack.findFirst({
    where: {
      id,
      OR: [
        { default: true },
        { private: false }
      ]
    },
    include: {
      editors: { select: { id: true, username: true, anonymous: true } },
      author: { select: { id: true, username: true, anonymous: true } },
      _count: { select: { usedInChats: true, elements: true } }
    }
  })
  return packs
}
