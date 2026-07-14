

export const config = {
  API_URL: import.meta.env.VITE_API_URL || 'https://backendsafezone-202186514803.southamerica-west1.run.app/api',
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  MOCK_DELAY: 300,
  DEBUG: import.meta.env.DEV,
}

if (config.DEBUG) {
  console.log(
    config.USE_MOCK
      ? '📁 Modo MOCK — sin backend'
      : `🔗 Conectado a: ${config.API_URL}`
  )
}
