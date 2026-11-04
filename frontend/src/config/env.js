export const env = {
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
  apiUrl: import.meta.env.VITE_API_URL || '/api/v1',
  mockDelay: Number(import.meta.env.VITE_MOCK_DELAY ?? 250),
}
