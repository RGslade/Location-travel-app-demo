import { isStringArray, parseStoredJson } from './storage';

describe('stored JSON validation', () => {
  it('falls back for malformed JSON', () => {
    expect(parseStoredJson('[broken', ['default'], isStringArray)).toEqual(['default']);
  });

  it('falls back when the JSON shape is not valid', () => {
    expect(parseStoredJson('{"unexpected":true}', ['default'], isStringArray)).toEqual(['default']);
  });

  it('accepts a validated string array', () => {
    expect(parseStoredJson('["place-1"]', [], isStringArray)).toEqual(['place-1']);
  });
});
