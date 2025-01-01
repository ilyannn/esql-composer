export const preset = "ts-jest";
export const testEnvironment = "jsdom";
export const testPathIgnorePatterns = [
  "/node_modules/",
  "/dist/",
  "/src/app/", // Can't make jest work with some modules
];
export const transform = {
  "^.+\\.tsx?$": "ts-jest",
  ".+\\.js$": "ts-jest",
};
export const transformIgnorePatterns = ["node_modules/(?!(motion-utils|ol))"];
export const moduleNameMapper = {
  "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  "react-markdown": "<rootDir>/src/__test__/__mocks__/react-markdown.jsx",
};
