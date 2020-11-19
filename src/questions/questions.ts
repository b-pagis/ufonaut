import {
  ChoiceCollection, ListQuestion, InputQuestion, ConfirmQuestion, PasswordQuestionOptions, CheckboxQuestion,
} from 'inquirer';

import {
  Source,
  ActionAnswer,
  Action,
  KEY_ACTION,
  KEY_INPUT,
  InputAnswer,
  KEY_CONFIRMED,
  ConfirmationAnswer,
  KEY_AUTH_TYPE,
  AuthorizationAnswer,
  KEY_AUTH_API_KEY_VALUE,
  KEY_AUTH_BASIC_USERNAME,
  KEY_AUTH_BASIC_PASSWORD,
  ConvertActions,
  ConvertActionsUsageAnswer,
  KEY_ADDITIONAL_ACTIONS,
  KEY_FILE_SOURCE_TYPE,
  SourceTypeAnswer,
  KEY_AUTH_BEARER_TOKEN,
  KEY_AUTH_API_KEY,
  KEY_AUTH_API_KEY_LOCATION,
  FileType,
  FileTypeAnswer,
  KEY_FILE_TYPE,
} from '../models/answer';
import { Exists } from '../utils/file.util';
import { AuthHeaderType, ApiKeyLocation } from '../utils/http.util.model';

const fileSourceTypeChoices: ChoiceCollection = [
  { name: 'file', value: Source.FILE },
  { name: 'remote', value: Source.URL },
];

const collectionAuthApiKeyLocationChoices: ChoiceCollection = [
  { name: 'header', value: ApiKeyLocation.HEADER },
  { name: 'query', value: ApiKeyLocation.QUERY },
];

const fileTypeChoices: ChoiceCollection = [
  { name: 'csv', value: FileType.CSV },
  { name: 'md', value: FileType.MD },
  { name: 'display in cli', value: FileType.NONE },
];

const authHeaderTypeChoices: ChoiceCollection = [
  { name: 'basic', value: AuthHeaderType.BASIC },
  { name: 'api-key', value: AuthHeaderType.API_KEY },
  { name: 'bearer', value: AuthHeaderType.BEARER },
];

const actionsChoices: ChoiceCollection = [
  { name: 'convert', value: Action.CONVERT },
  { name: 'create sets', value: Action.CREATE_SETS },
  { name: 'list endpoints', value: Action.LIST_ENDPOINTS },
];

const additionalConvertingChoices: ChoiceCollection = [
  { name: 'rename collection', value: ConvertActions.RENAME_COLLECTION },
  { name: 'apply external scripts', value: ConvertActions.APPLY_SCRIPTS },
  { name: 'change order', value: ConvertActions.ORDER_COLLECTION },
  { name: 'change endpoints auth', value: ConvertActions.CHANGE_ENDPOINTS_AUTH },
];

export const AdditionalConvertingActionsQuestion: CheckboxQuestion<ConvertActionsUsageAnswer> = {
  name: KEY_ADDITIONAL_ACTIONS,
  type: 'checkbox',
  message: 'choose additional actions:',
  choices: additionalConvertingChoices,
};

export const ActionQuestion: ListQuestion<ActionAnswer> = {
  name: KEY_ACTION,
  type: 'list',
  message: 'choose action?:',
  choices: actionsChoices,
};

export const FileSourceTypeQuestion: ListQuestion<SourceTypeAnswer> = {
  name: KEY_FILE_SOURCE_TYPE,
  type: 'list',
  default: Source.FILE,
  message: 'openapi file location type:',
  choices: fileSourceTypeChoices,
};

export const AuthorizationHeaderTypeQuestion: ListQuestion<AuthorizationAnswer> = {
  name: KEY_AUTH_TYPE,
  type: 'list',
  default: 'basic',
  message: 'authorization header type:',
  choices: authHeaderTypeChoices,
};

export const AuthorizationApiKeyQuestion: InputQuestion<AuthorizationAnswer> = {
  name: KEY_AUTH_API_KEY,
  type: 'input',
  default: 'x-api-key',
  message: 'use different key',
  validate(value) {
    if (value) {
      return true;
    }
    return 'please enter value';
  },
};
export const AuthorizationApiKeyLocation: ListQuestion<AuthorizationAnswer> = {
  name: KEY_AUTH_API_KEY_LOCATION,
  type: 'list',
  default: ApiKeyLocation.HEADER,
  message: 'api key location:',
  choices: collectionAuthApiKeyLocationChoices,
};
export const OutputFileTypeQuestion: ListQuestion<FileTypeAnswer> = {
  name: KEY_FILE_TYPE,
  type: 'list',
  default: FileType.NONE,
  message: 'output file type:',
  choices: fileTypeChoices,
};

export const AuthorizationHeaderQuestion = (headerType: AuthHeaderType): PasswordQuestionOptions<AuthorizationAnswer>[] => ([

  {
    name: KEY_AUTH_API_KEY_VALUE,
    type: 'input',
    message: 'input api key value',
    when(): boolean {
      return headerType === AuthHeaderType.API_KEY;
    },
    validate(value) {
      if (value) {
        return true;
      }
      return 'please enter value';
    },
  },
  {
    name: KEY_AUTH_BASIC_USERNAME,
    type: 'input',
    message: 'username:',
    when(): boolean {
      return headerType === AuthHeaderType.BASIC;
    },
    validate(value) {
      if (value) {
        return true;
      }
      return 'please enter username';
    },
  },
  {
    name: KEY_AUTH_BASIC_PASSWORD,
    type: 'password',
    message: 'password:',
    mask: '*',
    when(): boolean {
      return headerType === AuthHeaderType.BASIC;
    },
    validate(value) {
      if (value) {
        return true;
      }
      return 'please enter password';
    },
  },
  {
    name: KEY_AUTH_BEARER_TOKEN,
    type: 'input',
    message: 'input Authorization: Bearer token value:',
    when(): boolean {
      return headerType === AuthHeaderType.BEARER;
    },
    validate(value) {
      if (value) {
        return true;
      }
      return 'please enter value';
    },
  },

]);

export const ConfirmationQuestion = (text: string, defaultOption?: boolean): ConfirmQuestion<ConfirmationAnswer> => ({
  name: KEY_CONFIRMED,
  type: 'confirm',
  default: (defaultOption) || false,
  message: text,
});

export const InputFieldQuestion = (text: string): InputQuestion<InputAnswer> => ({
  name: KEY_INPUT,
  type: 'input',
  message: text,
  validate(value) {
    if (value) {
      return true;
    }
    return 'please input value';
  },
});

export const FilePathQuestion = (text: string, defaultPath?: string, validate?: boolean): InputQuestion<InputAnswer> => ({
  name: KEY_INPUT,
  type: 'input',
  default: defaultPath,
  message: text,
  validate(value) {
    if (!validate) {
      return true;
    }
    if (value && Exists(value)) {
      return true;
    }
    return 'incorrect path specified';
  },
});
