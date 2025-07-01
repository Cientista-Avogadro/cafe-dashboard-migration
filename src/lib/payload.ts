import payload from 'payload'

if (!process.env.PAYLOAD_SECRET) {
  throw new Error('PAYLOAD_SECRET environment variable is missing')
}

export { payload }

export const getPayloadClient = async () => {
  if (!payload.isInitialized) {
    await payload.init({
      secret: process.env.PAYLOAD_SECRET!,
      local: true,
    })
  }

  return payload
}