/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// biome-ignore lint/style/noNamespace: <explanation>
declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string): R;
  }
}
