import { storage } from '~/storage.js'

export default async function (packId: number, userId: number) {
  const elements = await storage.packElement.findMany({
    where: {
      pack: {
        id: packId,
        type: 'TITLES',
        OR: [
          { authorId: userId },
          { editors: { some: { id: userId } } }
        ]
      }
    },
    select: {
      content: true
    }
  })

  const str = elements.map(({ content }) => {
    return content.replaceAll('\n', '\\')
  }).join('\n')

  return str
}
