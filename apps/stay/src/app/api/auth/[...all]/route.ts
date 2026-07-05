import { auth } from '@/lib/auth'
import { toNextJsHandler } from '@public-internet/node-auth'

export const { GET, POST } = toNextJsHandler(auth)
