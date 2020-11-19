import { AuthHeaderType } from '../utils/http.util.model';

export const KEY_ACTION = 'action';
export const KEY_FILE_SOURCE_TYPE = 'fileSourceType';
export const KEY_INPUT = 'filePath';
export const KEY_CONFIRMED = 'confirmed';
export const KEY_AUTH_TYPE = 'authType';
export const KEY_AUTH_BASIC_USERNAME = 'authBasicUsername';
export const KEY_AUTH_BASIC_PASSWORD = 'authBasicPassword';
export const KEY_AUTH_API_KEY_VALUE = 'authApiKeyValue';
export const KEY_ADDITIONAL_ACTIONS = 'additionalActions';
export const KEY_AUTH_BEARER_TOKEN = 'authBearerToken';
export const KEY_AUTH_API_KEY_LOCATION = 'authApiKeyLocation';
export const KEY_AUTH_API_KEY = 'authApiKey';
export const KEY_FILE_TYPE = 'fileType';

export interface ConvertActionsUsageAnswer {
  [KEY_ADDITIONAL_ACTIONS]: ConvertActions[];
}

export interface AuthorizationAnswer {
  [KEY_AUTH_BASIC_USERNAME]: string;
  [KEY_AUTH_BASIC_PASSWORD]: string;
  [KEY_AUTH_API_KEY_VALUE]: string;
  [KEY_AUTH_BEARER_TOKEN]: string;
  [KEY_AUTH_TYPE]: AuthHeaderType
  [KEY_AUTH_API_KEY]: string;
  [KEY_AUTH_API_KEY_LOCATION]: string;
}

export interface AuthorizationTypeAnswer {
  [KEY_AUTH_TYPE]: AuthHeaderType;
}

export interface ConfirmationAnswer {
  [KEY_CONFIRMED]: boolean
}

export interface ActionAnswer {
  [KEY_ACTION]: Action
}

export interface SourceTypeAnswer {
  [KEY_FILE_SOURCE_TYPE]: Source
}

export interface InputAnswer {
  [KEY_INPUT]: string
}

export interface FileTypeAnswer {
  [KEY_FILE_TYPE]: FileType
}

export const enum ConvertActions {
  APPLY_SCRIPTS,
  ORDER_COLLECTION,
  RENAME_COLLECTION,
  CHANGE_ENDPOINTS_AUTH
}

export const enum Action {
  CONVERT = 'CONVERT',
  CREATE_SETS = 'MAKE_SET',
  LIST_ENDPOINTS = 'LIST_ENDPOINTS'
}

export enum Source {
  FILE = 'FILE',
  URL = 'URL'
}

export enum FileType {
  MD = 'md',
  CSV = 'csv',
  NONE = 'none'
}
