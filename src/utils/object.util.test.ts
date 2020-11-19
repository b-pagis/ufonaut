/* eslint-disable @typescript-eslint/no-explicit-any */
import { IsObject, IsArray } from './object.util';

const array = ['a', 'b'];
const notArray = 'string';
const object = {
  withArray: [{ key: 'value' }, { key2: 'value2' }],
  key: 'value',
};

describe('IsObject', () => {
  test('given array is object', () => {
    expect(IsObject(array as any)).toBe(true);
  });

  test('given string is not object', () => {
    expect(IsObject(notArray as any)).toBe(false);
  });

  test('given object is object', () => {
    expect(IsObject(object)).toBe(true);
  });

  test('given array of object is object', () => {
    expect(IsObject(object.withArray as any)).toBe(true);
  });
});
describe('IsArray', () => {
  test('Object array is Array', () => {
    expect(IsArray(array as any)).toBe(true);
  });

  test('Object notArray is not Array', () => {
    expect(IsArray(notArray as any)).toBe(false);
  });

  test('Object object is not Array', () => {
    expect(IsArray(object)).toBe(false);
  });

  test('Object object.withArray is Array', () => {
    expect(IsArray(object.withArray as any)).toBe(true);
  });
});
