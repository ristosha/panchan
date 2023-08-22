import { nanoid as nano } from 'nanoid'
import { nanoid as asyncNano } from 'nanoid/async'

export const getId = () => nano(12)
export const getAsyncId = async () => await asyncNano(12)
