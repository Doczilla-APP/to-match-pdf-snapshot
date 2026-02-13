/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(pdfjs-dist)/)'
  ],
  transform: {
    '^.+\\.mjs$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }]
  }
}