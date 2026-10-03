interface ImportMetaEnv {
  // URL base da API. Padrão: http://localhost:3000
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
