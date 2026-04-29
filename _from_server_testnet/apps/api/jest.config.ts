export default {
  displayName: "api",
  preset: "../../jest.preset.js",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "../../coverage/apps/api",
  setupFilesAfterEnv: ["<rootDir>/src/testing/jest.setup.ts"],
  testTimeout: 60_000
}
