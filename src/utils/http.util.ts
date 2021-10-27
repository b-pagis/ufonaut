import axios, { AxiosPromise, AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { Agent } from 'https';
import { URL } from 'url';
import { AuthHeaderType } from './http.util.model';

export function GetAuthHeader(username: string, password: string, xApiKey: string, token: string, authHeaderType: AuthHeaderType): AxiosRequestHeaders {
  const headers: AxiosRequestHeaders = {};

  if (authHeaderType === AuthHeaderType.BASIC) {
    const buff = Buffer.from(`${username}:${password}`);
    headers.Authorization = `Basic ${buff.toString('base64')}`;
    return headers;
  }

  if (authHeaderType === AuthHeaderType.API_KEY) {
    headers['X-API-KEY'] = xApiKey;
    return headers;
  }

  if (authHeaderType === AuthHeaderType.BEARER) {
    headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  return headers;
}

export function GetRemoteFile(url: string, authHeader: AxiosRequestHeaders | undefined): AxiosPromise {
  const options: AxiosRequestConfig = {
    httpsAgent: new Agent({
      rejectUnauthorized: false,
    }),
    headers: authHeader,
    responseType: 'json',
  };

  const response = axios.get(url, options).catch((err: Error) => { throw err; });
  return response;
}

export function IsURL(s: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(s);
    return true;
  } catch (err) {
    return false;
  }
}
