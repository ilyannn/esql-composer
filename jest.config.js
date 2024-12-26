module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/src/app/", // Can't make jest work with some modules
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    ".+\\.js$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!(motion-utils|ol))"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "react-markdown": "<rootDir>/src/__test__/__mocks__/react-markdown.js",
  },
};
