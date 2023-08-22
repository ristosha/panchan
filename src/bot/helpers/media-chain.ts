import { type GeneratedMediaType, type MediaMIME } from '@prisma/client'

import { storage } from '~/storage.js'

export interface MediaChainElement {
  id: number
  type: GeneratedMediaType
  mime: MediaMIME
  content: string | null
  source_file_id: string
  result_file_id: string
  meta: Record<string, unknown>
  created_at: Date
  a_anonymous: boolean
  a_username: string | null
  use_count: number
}

export async function getMediaChain (sourceFileId: string): Promise<MediaChainElement[]> {
  const results = await storage.$queryRaw<MediaChainElement[]>`
  WITH RECURSIVE chain AS
                   (SELECT gm.id,
                           gm.type,
                           gm.mime,
                           gm.content,
                           gm.source_file_id,
                           gm.result_file_id,
                           gm.created_at,
                           gm.meta,
                           author.anonymous as a_anonymous,
                           author.username as a_username,
                           (SELECT COUNT(*)
                            FROM generated_media_uses gmu
                            WHERE gmu.generated_media_id = gm.id) AS use_count
                    FROM generated_media gm
                             LEFT JOIN
                         public.users author ON author.id = gm.author_id
                    WHERE gm.source_file_id = ${sourceFileId}

                    UNION ALL

                    (SELECT gm.id,
                           gm.type,
                           gm.mime,
                           gm.content,
                           gm.source_file_id,
                           gm.result_file_id,
                           gm.created_at,
                           gm.meta,
                           author.anonymous as a_anonymous,
                           author.username as a_username,
                           (SELECT COUNT(*)
                            FROM generated_media_uses gmu
                            WHERE gmu.generated_media_id = gm.id) AS use_count
                     FROM generated_media gm
                              LEFT JOIN
                          public.users author ON author.id = gm.author_id
                              JOIN chain c
                                   ON c.source_file_id = gm.result_file_id))

  SELECT * FROM chain;`
  return results
}

export async function getMediaChainById (id: number): Promise<MediaChainElement[]> {
  const results = await storage.$queryRaw<MediaChainElement[]>`
 WITH RECURSIVE chain AS
                   (SELECT gm.id,
                           gm.type,
                           gm.mime,
                           gm.content,
                           gm.source_file_id,
                           gm.result_file_id,
                           gm.created_at,
                           author.anonymous as a_anonymous,
                           author.username as a_username,
                           (SELECT COUNT(*)
                            FROM generated_media_uses gmu
                            WHERE gmu.generated_media_id = gm.id) AS use_count
                    FROM generated_media gm
                             LEFT JOIN
                         public.users author ON author.id = gm.author_id
                    WHERE gm.id = ${id}

                    UNION ALL

                    (SELECT gm.id,
                           gm.type,
                           gm.mime,
                           gm.content,
                           gm.source_file_id,
                           gm.result_file_id,
                           gm.created_at,
                           author.anonymous as a_anonymous,
                           author.username as a_username,
                           (SELECT COUNT(*)
                            FROM generated_media_uses gmu
                            WHERE gmu.generated_media_id = gm.id) AS use_count
                     FROM generated_media gm
                              LEFT JOIN
                          public.users author ON author.id = gm.author_id
                              JOIN chain c
                                   ON c.source_file_id = gm.result_file_id))

  SELECT * FROM chain;`
  return results
}
