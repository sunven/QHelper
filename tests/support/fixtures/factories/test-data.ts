export type JsonInputFactory = {
  raw: string;
  expectedValid: boolean;
};

export function createJsonInput(
  overrides: Partial<JsonInputFactory> = {},
): JsonInputFactory {
  const defaults: JsonInputFactory = {
    raw: JSON.stringify({ name: 'test', value: 42 }),
    expectedValid: true,
  };
  return { ...defaults, ...overrides };
}

export function createInvalidJsonInput(): JsonInputFactory {
  return createJsonInput({
    raw: '{ invalid json',
    expectedValid: false,
  });
}
