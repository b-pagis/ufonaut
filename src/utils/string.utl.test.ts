import { Capitalize, LettersOnlyWithDash } from './string.util';

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

test('mixed letters', () => {
  expect(LettersOnlyWithDash('#$%^&*(+a)(*&^%#-+/32 G 15646')).toEqual('a-G');
});

test('non letters', () => {
  expect(LettersOnlyWithDash('#$%^&*(+)(*&^%#-+/3215646')).toEqual('-');
});

test('only letters with space', () => {
  expect(LettersOnlyWithDash('abcdef asd FX')).toEqual('abcdefasdFX');
});

test('only letters with space and dash', () => {
  expect(LettersOnlyWithDash('abcdef asd-FX')).toEqual('abcdefasd-FX');
});

test('single word', () => {
  expect(LettersOnlyWithDash('Demo')).toEqual('Demo');
});
