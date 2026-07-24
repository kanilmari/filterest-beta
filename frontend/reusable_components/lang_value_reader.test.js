import { describe, test, expect } from 'vitest';
import { extractLangValue } from './lang_value_reader.js';

describe('extractLangValue', () => {
  test('null/undefined returns empty string', () => {
    expect(extractLangValue(null)).toBe('');
    expect(extractLangValue(undefined)).toBe('');
  });

  test('plain string passes through', () => {
    expect(extractLangValue('hello')).toBe('hello');
    expect(extractLangValue('123')).toBe('123');
  });

  test('extracts chosen language from lang object', () => {
    const json = JSON.stringify({ fi: 'Moi', en: 'Hello', sv: 'Hej' });
    expect(extractLangValue(json, 'fi')).toBe('Moi');
    expect(extractLangValue(json, 'en')).toBe('Hello');
    expect(extractLangValue(json, 'sv')).toBe('Hej');
  });

  test('falls back to first available language', () => {
    const json = JSON.stringify({ fi: 'Moi', sv: 'Hej' });
    expect(extractLangValue(json, 'de')).toBe('Moi');
  });

  test('defaults to en when no chosenLang', () => {
    const json = JSON.stringify({ fi: 'Moi', en: 'Hello' });
    expect(extractLangValue(json)).toBe('Hello');
  });

  test('non-lang JSON object with non-string values returns first string value', () => {
    // keys match lang regex (2-5 chars) but count is number, not string
    // so looksLikeLangObj is false, but isMultilingual defaults to null
    // → falls through to firstKey fallback
    const json = JSON.stringify({ name: 'test', count: 5 });
    expect(extractLangValue(json)).toBe('test');
  });

  test('object with long keys falls back to first string value', () => {
    // keys fail lang regex but isMultilingual=null → still attempts extraction
    const json = JSON.stringify({ longkey: 'val', anotherlong: 'val2' });
    expect(extractLangValue(json)).toBe('val');
  });

  test('isMultilingual=false with long keys returns raw string', () => {
    // keys fail lang regex AND isMultilingual=false → returns raw
    const json = JSON.stringify({ longkey: 'val', anotherlong: 'val2' });
    expect(extractLangValue(json, 'en', false)).toBe(json);
  });

  test('invalid JSON passes through', () => {
    expect(extractLangValue('{broken')).toBe('{broken');
  });

  test('isMultilingual=false skips non-lang objects with long keys', () => {
    const json = JSON.stringify({ longkey: 'test', another: 'x' });
    expect(extractLangValue(json, 'en', false)).toBe(json);
  });

  test('isMultilingual=false with lang-like keys still extracts', () => {
    // keys are 2-5 chars and all values are strings → looksLikeLangObj = true
    // isMultilingual=false only skips when !looksLikeLangObj
    const json = JSON.stringify({ name: 'test', value: 'x' });
    expect(extractLangValue(json, 'name', false)).toBe('test');
  });

  test('isMultilingual=true treats lang-like object as multilingual', () => {
    const json = JSON.stringify({ fi: 'Moi', en: 'Hello' });
    expect(extractLangValue(json, 'fi', true)).toBe('Moi');
  });

  test('number input converts to string', () => {
    expect(extractLangValue(42)).toBe('42');
  });

  test('empty object returns raw string', () => {
    expect(extractLangValue('{}')).toBe('{}');
  });

  test('array JSON returns raw string', () => {
    const json = JSON.stringify([1, 2, 3]);
    expect(extractLangValue(json)).toBe(json);
  });
});
