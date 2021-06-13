import { Capitalize, LettersNumbersWithDash } from './string.util';

describe('Capitalize', () => {
  test('capital word', () => {
    expect(Capitalize('word')).toBe('Word');
  });

  test('capital first word', () => {
    expect(Capitalize('word demo')).toBe('Word demo');
  });

  test('not capital word', () => {
    expect(Capitalize('word')).not.toBe('word');
  });

  test('not capital words', () => {
    expect(Capitalize('word demo')).not.toBe('word Demo');
  });
});

describe('LettersNumbersWithDash', () => {
  test('mixed letters', () => {
    expect(LettersNumbersWithDash('#$%^&*(+a)(*&^%#-+/32 G 15646')).toEqual('a-32G15646');
  });

  test('non letters', () => {
    expect(LettersNumbersWithDash('#$%^&*(+)(*&^%#-+/3215646')).toEqual('-3215646');
  });

  test('only letters with space', () => {
    expect(LettersNumbersWithDash('abcdef asd FX')).toEqual('abcdefasdFX');
  });

  test('only letters with space and dash', () => {
    expect(LettersNumbersWithDash('abcdef asd-FX')).toEqual('abcdefasd-FX');
  });

  test('single word', () => {
    expect(LettersNumbersWithDash('Demo')).toEqual('Demo');
  });

  test('numbers with space', () => {
    expect(LettersNumbersWithDash('1 2 3 ')).toEqual('123');
  });
  test('numbers', () => {
    expect(LettersNumbersWithDash('123')).toEqual('123');
  });
  test('with dots', () => {
    expect(LettersNumbersWithDash('1.2.3')).toEqual('123');
  });

  test('empty', () => {
    expect(LettersNumbersWithDash('')).toEqual('');
  });
});
