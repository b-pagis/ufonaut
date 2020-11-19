import axios, { AxiosResponse } from 'axios';
import { OutgoingHttpHeaders } from 'http';
import { GetAuthHeader, GetRemoteFile, IsURL } from './http.util';
import { AuthHeaderType } from './http.util.model';

jest.mock('axios');

test('Basic Auth header', () => {
  const expectedHeader: OutgoingHttpHeaders = {
    Authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
  };
  expect(GetAuthHeader('username', 'password', '', 'token-123', AuthHeaderType.BASIC)).toMatchObject(expectedHeader);
});

test('X-API-KEY header', () => {
  const expectedHeader: OutgoingHttpHeaders = {
    'X-API-KEY': 'abcd-efgh-yjkl-9999',
  };
  expect(GetAuthHeader('username', 'password', 'abcd-efgh-yjkl-9999', 'token-123', AuthHeaderType.API_KEY)).toMatchObject(expectedHeader);
});
test('Authorization Bearer header', () => {
  const expectedHeader: OutgoingHttpHeaders = {
    Authorization: 'Bearer token-123',
  };
  expect(GetAuthHeader('username', 'password', 'abcd-efgh-yjkl-9999', 'token-123', AuthHeaderType.BEARER)).toMatchObject(expectedHeader);
});

test('Unknown header type', () => {
  const expectedHeader: OutgoingHttpHeaders = {};
  expect(GetAuthHeader('username', 'password', 'abcd-efgh-yjkl-9999', '', 'not-defined-type' as AuthHeaderType)).toMatchObject(expectedHeader);
});

test('Get remote file', async () => {
  const expectedResult = 'result';
  const responsePromise = Promise.resolve({ data: expectedResult } as AxiosResponse);
  const errorResult = Error('something failed');
  const expectedHeader: OutgoingHttpHeaders = {
    key: 'value',
  };

  const mock = jest.spyOn(axios, 'get');
  mock.mockReturnValueOnce(responsePromise);

  const result = await GetRemoteFile('url', expectedHeader);

  expect(mock).toHaveBeenCalled();
  expect(result.data).toBe(expectedResult);

  const mockError = jest.spyOn(axios, 'get');
  mockError.mockImplementationOnce(async () => { throw errorResult; });

  await GetRemoteFile('url', expectedHeader).catch((err:Error) => {
    expect(err).toStrictEqual(Error('something failed'));
  });

  mock.mockRestore();
  mockError.mockRestore();
});

test('IsURL valid', () => {
  expect(IsURL('https://localhost:8080/openapi.json')).toBe(true);
  expect(IsURL('http://localhost:8080/openapi.json')).toBe(true);
  expect(IsURL('https://localhost/openapi.json')).toBe(true);
  expect(IsURL('http://localhost/openapi.json')).toBe(true);
  expect(IsURL('ftp://localhost/openapi.json')).toBe(true);
  expect(IsURL('file://localhost/openapi.json')).toBe(true);
  expect(IsURL('//localhost/openapi.json')).toBe(false);
  expect(IsURL('/localhost/openapi.json')).toBe(false);
  expect(IsURL('/tmp/openapi.json')).toBe(false);
  expect(IsURL('./file/openapi.json')).toBe(false);
  expect(IsURL('./openapi.json')).toBe(false);
  expect(IsURL('./../../openapi.json')).toBe(false);
  expect(IsURL('openapi.json')).toBe(false);
});
