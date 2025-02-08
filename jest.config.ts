import nextJest from 'next/jest'
import type { Config } from 'jest'

// Provide the path to your Next.js app.
const createJestConfig = nextJest({
    dir: './'
})

const customJestConfig: Config = {
    testEnvironment: 'jest-environment-jsdom',
    // Use ts-jest with ESM support (if you're treating TS files as ESM)
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }]
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    moduleNameMapper: {
        '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    transformIgnorePatterns: ['node_modules/(?!(next|@next|next\\/dist)/)']
}

export default createJestConfig(customJestConfig)
