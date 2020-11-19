/* eslint-disable @typescript-eslint/no-explicit-any */
import { red, green } from 'kleur';
import { sep } from 'path';
import { AxiosResponse } from 'axios';
import { Collection } from 'postman-collection';
import { Converter } from '../converter/converter';
import { IOptions, CollectionSet } from '../converter/converter.model';
import { IOptions as IExecutorOptions } from '../executor/executor.model';
import { ExecuteListEndpoints, ExecuteConvertWrite, ExecuteCreateWriteSets } from './executor';
import { GetScriptsContent, WriteFile } from '../utils/file.util';
import { GetAuthHeader } from '../utils/http.util';
import { AuthHeaderType } from '../utils/http.util.model';

function consoleErrorTextHelper(text: string): string {
  return `${red('ERROR: ')}${text}${'\n'}`;
}

function consoleSuccessTextHelper(text: string): string {
  return `${green('SUCCESS: ')}${text}${'\n'}`;
}

const mockedCollection = {
  ListEndpoints: jest.fn().mockImplementation(() => [
    { actual: { method: 'm1', path: 'p1' }, normalized: 'm1-p1' },
    { actual: { method: 'm2', path: 'p2' }, normalized: 'm2-p2' },
  ]),
  Order: jest.fn().mockImplementation(),
  Rename: jest.fn().mockImplementation(),
  AddScripts: jest.fn().mockImplementation(),
  SetAuthorization: jest.fn().mockImplementation(),
  GetAuthDefinition: jest.fn().mockImplementation((auth: any) => { if (auth.type === 'badAuthType') throw new Error('bad auth type'); }),
};

let converterShouldFail: boolean | undefined;

const mockedSetCollection: CollectionSet[] = [
  {
    name: 'mocked-collection',
    collection: mockedCollection as unknown as Collection,
  },
];

const mockedConverter = {
  options: { fail: false },
  Convert: jest.fn().mockResolvedValue(mockedCollection),
  CreateSets: jest.fn().mockResolvedValue(mockedSetCollection),
};

const mockedConverterRejected = {
  options: { fail: true },
  Convert: jest.fn().mockRejectedValue(new Error('rejected')),
  CreateSets: jest.fn().mockRejectedValue(new Error('rejected')),
};

jest.mock('../converter/converter', () => ({
  Converter: jest.fn().mockImplementation((o) => {
    if (converterShouldFail === undefined) {
      converterShouldFail = o.fail;
    }
    return (converterShouldFail) ? mockedConverterRejected : mockedConverter;
  }),
}));

jest.mock('postman-collection', () => ({
  Collection: jest.fn().mockImplementation(() => mockedCollection),
}));

jest.mock('../utils/http.util', () => ({
  GetAuthHeader: jest.fn((
    username: string,
    password: string,
    xApiKey: string,
    token: string,
    authHeaderType: AuthHeaderType,
  ) => `header: ${username} ${password} ${xApiKey} ${token} ${authHeaderType}`),
  IsURL: jest.fn((value: string) => ['url', 'urlReject'].includes(value)),
  GetRemoteFile: jest.fn().mockImplementation((
    file: string,
  ) => ((file === 'url') ? Promise.resolve({ data: 'result' } as AxiosResponse) : Promise.reject(new Error('rejected')))),
}));

jest.mock('../utils/file.util', () => ({
  Exists: jest.fn((path) => {
    switch (path) {
      case 'existingScriptsPath':
      case `existingScriptsPath${sep}test`:
      case `existingScriptsPath${sep}pre-request`:
      case 'existingPath':
      case 'correctOrderConfigPath':
      case 'existingSetsConfigPath':
        return true;
      default:
        return false;
    }
  }),
  GetScriptsContent: jest.fn().mockImplementation(() => '{"order":[{"method":"post","path":"user"}]}'),
  GetFile: jest.fn((path) => {
    switch (path) {
      case 'existingPath':
        return (path === 'existingPath' || path === `existingPath${sep}test` || path === `existingPath${sep}pre-request`) ? 'content' : '';
      case 'correctOrderConfigPath':
      case 'existingScriptsPath':
      case `existingScriptsPath${sep}test`:
      case `existingScriptsPath${sep}pre-request`:
        return '{"order":[{"method":"post","path":"user"}]}';
      case 'existingSetsConfigPath':
        // eslint-disable-next-line max-len
        return '{"sets":[{"collectionName":"pc-sets-store-example","scriptsPath":"examples/scripts","template":{"preRequestTemplateFilePath":"examples/scripts/template/pre-request.template"},"auth":{"type":"basic","forced":false,"basic":{"username":"user","password":"user-password"}},"order":[{"method":"post","path":"store/order"}]},{"collectionName":"pc-sets-pet-example","auth":{"type":"apikey","apikey":{"location":"header","key":"x-my-key","value":"key-123"}},"order":[{"method":"get","path":"pet/findByStatus"},{"method":"put","path":"pet"}]}]}';
      default:
        throw new Error(`${path} path not found`);
    }
  }),
  WriteFile: jest.fn().mockImplementation(),
}));

const converter = new Converter({ fail: true } as unknown as IOptions);
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
afterAll(() => {
  mockConsoleError.mockReset();
  mockConsoleLog.mockReset();
  mockConsoleInfo.mockReset();
});

describe('ExecuteListEndpoints', () => {
  beforeEach(() => {
    converterShouldFail = true;
  });
  test('display error on non existing input', async () => {
    const executorOptions: IExecutorOptions = { inputFileLocation: 'notExistingPath' };
    ExecuteListEndpoints(executorOptions);

    expect(converter.Convert).not.toBeCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(consoleErrorTextHelper('notExistingPath not found or you do not have access to the file'));
  });

  test('successfully list endpoints from local path', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = { inputFileLocation: 'existingPath' };
    ExecuteListEndpoints(executorOptions);

    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleLog).toBeCalledTimes(2);
    await expect(mockConsoleLog).toHaveBeenCalledWith('m1 p1');
    await expect(mockConsoleLog).toHaveBeenCalledWith('m2 p2');
  });
  test('successfully list normalized endpoints', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = { inputFileLocation: 'existingPath', displayNormalized: true };
    ExecuteListEndpoints(executorOptions);

    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleLog).toBeCalledTimes(2);
    await expect(mockConsoleLog).toHaveBeenCalledWith('m1 p1 | m1-p1');
    await expect(mockConsoleLog).toHaveBeenCalledWith('m2 p2 | m2-p2');
  });
  test('successfully list normalized endpoints from url', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = { inputFileLocation: 'url', displayNormalized: true };
    await ExecuteListEndpoints(executorOptions);

    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleLog).toBeCalledTimes(2);
    await expect(mockConsoleLog).toHaveBeenCalledWith('m1 p1 | m1-p1');
    await expect(mockConsoleLog).toHaveBeenCalledWith('m2 p2 | m2-p2');
  });
  test('successfully list normalized endpoints from url with basic auth', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      displayNormalized: true,
      authHeaderBasicAuthUsername: 'username',
      authHeaderBasicAuthPassword: 'password',
    };
    await ExecuteListEndpoints(executorOptions);

    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleLog).toBeCalledTimes(2);
    await expect(mockConsoleLog).toHaveBeenCalledWith('m1 p1 | m1-p1');
    await expect(mockConsoleLog).toHaveBeenCalledWith('m2 p2 | m2-p2');
  });
  test('successfully list normalized endpoints from url with api key auth', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      displayNormalized: true,
      authHeaderXApiKey: 'api-key',
    };
    await ExecuteListEndpoints(executorOptions);

    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleLog).toBeCalledTimes(2);
    await expect(mockConsoleLog).toHaveBeenCalledWith('m1 p1 | m1-p1');
    await expect(mockConsoleLog).toHaveBeenCalledWith('m2 p2 | m2-p2');
  });
  test('successfully list normalized endpoints from url with bearer token auth', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      displayNormalized: true,
      authHeaderBearerToken: 'token',
    };
    await ExecuteListEndpoints(executorOptions);

    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleLog).toBeCalledTimes(2);
    await expect(mockConsoleLog).toHaveBeenCalledWith('m1 p1 | m1-p1');
    await expect(mockConsoleLog).toHaveBeenCalledWith('m2 p2 | m2-p2');
  });
  test('successfully output normalized endpoint list in markdown', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      displayNormalized: true,
      outputPath: 'output.md',
      outputFileType: 'md',
    };
    await ExecuteListEndpoints(executorOptions);

    const expectedMdContent = `|Method|Path|Normalized|
|---|---|---|
|m1|p1|m1-p1|
|m2|p2|m2-p2|
`;

    await expect(localConverter.Convert).toBeCalled();
    await expect(WriteFile).toBeCalledWith('output.md', expectedMdContent);
    await expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Markdown file created'));
  });

  test('successfully output endpoint list in markdown', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output.md',
      outputFileType: 'md',
    };
    await ExecuteListEndpoints(executorOptions);

    const expectedMdContent = `|Method|Path|
|---|---|
|m1|p1|
|m2|p2|
`;

    await expect(localConverter.Convert).toBeCalled();
    await expect(WriteFile).toBeCalledWith('output.md', expectedMdContent);
    await expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Markdown file created'));
  });
  test('successfully output endpoint list in csv', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output.csv',
      outputFileType: 'csv',
    };
    await ExecuteListEndpoints(executorOptions);

    const expectedMdContent = `m1;p1
m2;p2
`;

    await expect(localConverter.Convert).toBeCalled();
    await expect(WriteFile).toBeCalledWith('output.csv', expectedMdContent);
    await expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('CSV file created'));
  });
  test('successfully output normalized endpoint list in csv', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      displayNormalized: true,
      outputPath: 'output.csv',
      outputFileType: 'csv',
    };
    await ExecuteListEndpoints(executorOptions);

    const expectedMdContent = `m1;p1;m1-p1
m2;p2;m2-p2
`;

    await expect(localConverter.Convert).toBeCalled();
    await expect(WriteFile).toBeCalledWith('output.csv', expectedMdContent);
    await expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('CSV file created'));
  });
  test('converter should fail', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      displayNormalized: true,
      outputPath: 'output.csv',
      outputFileType: 'csv',
    };
    await ExecuteListEndpoints(executorOptions);

    await expect(converter.Convert).rejects.toStrictEqual(new Error('rejected'));
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Failed to convert open API file to postman collection. Reason Error: rejected'),
      );
  });
  test('fail to get input from URL', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'urlReject',
      displayNormalized: true,
      outputPath: 'output.csv',
      outputFileType: 'csv',
    };
    await ExecuteListEndpoints(executorOptions);

    await expect(converter.Convert).rejects.toStrictEqual(new Error('rejected'));
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Failed to get urlReject. Reason: Error: rejected'),
      );
  });
  test('basic auth username is missing', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'urlReject',
      displayNormalized: true,
      outputPath: 'output.csv',
      outputFileType: 'csv',
      authHeaderBasicAuthPassword: 'password',
    };
    await ExecuteListEndpoints(executorOptions);

    await expect(converter.Convert).not.toBeCalled();
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Basic auth username is missing'),
      );
  });
  test('basic auth password is missing', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'urlReject',
      displayNormalized: true,
      outputPath: 'output.csv',
      outputFileType: 'csv',
      authHeaderBasicAuthUsername: 'username',
    };
    await ExecuteListEndpoints(executorOptions);

    await expect(converter.Convert).not.toBeCalled();
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Basic auth password is missing'),
      );
  });
  test('cannot use basic auth with api key', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'urlReject',
      displayNormalized: true,
      outputPath: 'output.csv',
      outputFileType: 'csv',
      authHeaderBasicAuthUsername: 'username',
      authHeaderBasicAuthPassword: 'password',
      authHeaderXApiKey: 'api-key',
    };
    await ExecuteListEndpoints(executorOptions);

    await expect(converter.Convert).not.toBeCalled();
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Please use either basic auth, X-API-KEY or Bearer token'),
      );
  });
  test('cannot use basic auth with bearer token', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'urlReject',
      displayNormalized: true,
      outputPath: 'output.csv',
      outputFileType: 'csv',
      authHeaderBasicAuthUsername: 'username',
      authHeaderBasicAuthPassword: 'password',
      authHeaderBearerToken: 'token',
    };
    await ExecuteListEndpoints(executorOptions);

    await expect(converter.Convert).not.toBeCalled();
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Please use either basic auth, X-API-KEY or Bearer token'),
      );
  });
  test('cannot use basic auth with bearer token and api-key', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'urlReject',
      displayNormalized: true,
      outputPath: 'output.csv',
      outputFileType: 'csv',
      authHeaderBasicAuthUsername: 'username',
      authHeaderBasicAuthPassword: 'password',
      authHeaderBearerToken: 'token',
      authHeaderXApiKey: 'api-key',
    };
    await ExecuteListEndpoints(executorOptions);

    await expect(converter.Convert).not.toBeCalled();
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Please use either basic auth, X-API-KEY or Bearer token'),
      );
  });
});
describe('ExecuteConvertWrite', () => {
  beforeEach(() => {
    converterShouldFail = true;
  });
  test('successfully convert from remote input', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      scriptsCatalogLocation: 'existingScriptsPath',
      orderConfigFileLocation: 'correctOrderConfigPath',
      collectionName: 'newName',
    };
    await ExecuteConvertWrite(executorOptions);
    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Conversion complete'));
  });
  test('successfully convert from local input to current location', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'existingPath',
    };
    await ExecuteConvertWrite(executorOptions);
    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Conversion complete'));
  });
  test('succeed converting with template', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      scriptsCatalogLocation: 'existingScriptsPath',
      orderConfigFileLocation: 'correctOrderConfigPath',
      collectionName: 'newName',
      collectionPreRequestScriptTemplateLocation: 'existingPath',
    };
    await ExecuteConvertWrite(executorOptions);
    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Conversion complete'));
    await expect(GetScriptsContent).toBeCalled();
    expect(mockedCollection.Rename).toBeCalledWith('newName');
  });

  test('succeed converting without scripts and without renaming', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
    };
    await ExecuteConvertWrite(executorOptions);
    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Conversion complete'));
  });

  test('console error when order config is not found', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: '',
      orderConfigFileLocation: 'notExistingPath',
    };
    ExecuteConvertWrite(executorOptions);

    expect(converter.Convert).not.toBeCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      consoleErrorTextHelper('notExistingPath not found or you do not have access to the file'),
    );
  });

  test('console error when fails to parse incorrect order config', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: '',
      orderConfigFileLocation: 'existingPath',
    };
    ExecuteConvertWrite(executorOptions);

    expect(converter.Convert).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Failed to parse order config file existingPath content. Reason: SyntaxError: Unexpected token c in JSON at position 0'),
      );
  });

  test('console error fails to parse incorrect scripts path', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: '',
      scriptsCatalogLocation: 'notExistingPath',
    };
    ExecuteConvertWrite(executorOptions);

    expect(converter.Convert).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('notExistingPath not found or there are no [test] and [pre-request] catalogs, or you do not have access to it'),
      );
  });
  test('console error when input file does not exist', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'notExistingPath',
    };
    ExecuteConvertWrite(executorOptions);

    expect(converter.Convert).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('notExistingPath not found or you do not have access to the file'),
      );
  });

  test('console error when missing password in auth header', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      authHeaderBasicAuthUsername: 'username',
    };
    ExecuteConvertWrite(executorOptions);

    expect(converter.Convert).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Basic auth password is missing'),
      );
  });
  test('console error when missing username in auth header', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      authHeaderBasicAuthPassword: 'password',
    };
    ExecuteConvertWrite(executorOptions);

    expect(converter.Convert).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Basic auth username is missing'),
      );
  });
  test('console error when basic auth and API-KEY is provided in auth header', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      authHeaderBasicAuthUsername: 'username',
      authHeaderBasicAuthPassword: 'password',
      authHeaderXApiKey: 'api-key',
    };
    ExecuteConvertWrite(executorOptions);

    expect(converter.Convert).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Please use either basic auth, X-API-KEY or Bearer token'),
      );
  });

  test('console error when missing password and X-API-KEY is provided in auth header', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      authHeaderBasicAuthUsername: 'username',
      authHeaderXApiKey: 'api-key',
    };
    ExecuteConvertWrite(executorOptions);

    expect(converter.Convert).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Please use either basic auth, X-API-KEY or Bearer token'),
      );
  });
  test('console error when missing username and X-API-KEY is provided in auth header', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      authHeaderBasicAuthPassword: 'password',
      authHeaderXApiKey: 'api-key',
    };
    ExecuteConvertWrite(executorOptions);

    expect(converter.Convert).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Please use either basic auth, X-API-KEY or Bearer token'),
      );
  });

  test('set collection auth to basic auth', async () => {
    converterShouldFail = false;
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'existingPath',
      collectionAuthType: 'basic',
      collectionBasicAuthUsername: 'username',
      collectionBasicAuthPassword: 'password',
    };
    ExecuteConvertWrite(executorOptions);
    await expect(converter.Convert).resolves;
    expect(mockedCollection.GetAuthDefinition).toBeCalled();
    expect(mockedCollection.SetAuthorization).toBeCalled();
  });

  test('set collection auth api key header location', async () => {
    converterShouldFail = false;
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'existingPath',
      collectionAuthType: 'apikey',
      collectionApiKeyAuthValue: 'api-key-value',
      collectionApiKeyAuthLocation: 'header',
    };

    ExecuteConvertWrite(executorOptions);

    await expect(converter.Convert).resolves;
    expect(mockedCollection.GetAuthDefinition).toBeCalled();
    expect(mockedCollection.SetAuthorization).toBeCalled();
  });

  test('set basic auth header', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      authHeaderBasicAuthUsername: 'username',
      authHeaderBasicAuthPassword: 'password',
    };

    ExecuteConvertWrite(executorOptions);
    expect(GetAuthHeader).toBeCalledWith('username', 'password', '', '', AuthHeaderType.BASIC);
  });
  test('set api key auth header', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      authHeaderXApiKey: 'api-key',
    };
    ExecuteConvertWrite(executorOptions);
    expect(GetAuthHeader).toBeCalledWith('', '', 'api-key', '', AuthHeaderType.API_KEY);
  });
  test('set bearer auth header', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      authHeaderBearerToken: 'token',
    };
    ExecuteConvertWrite(executorOptions);
    expect(GetAuthHeader).toBeCalledWith('', '', '', 'token', AuthHeaderType.BEARER);
  });
  test('fail to get remote file', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'urlReject',
    };
    await ExecuteConvertWrite(executorOptions);
    await expect(converter.Convert).not.toBeCalled();
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Failed to get urlReject. Reason: Error: rejected'),
      );
  });

  test('fail converting', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
    };
    await ExecuteConvertWrite(executorOptions);
    await expect(converter.Convert).rejects.toStrictEqual(new Error('rejected'));
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Error: rejected'),
      );
  });
  test('fail due to incorrect auth', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      collectionAuthType: 'badAuthType',
    };
    await ExecuteConvertWrite(executorOptions);
    await expect(localConverter.Convert).toBeCalled();
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Failed to set auth to collection. Reason: Error: bad auth type'),
      );
  });
  test('script template does not exists', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      scriptsCatalogLocation: 'existingScriptsPath',
      collectionPreRequestScriptTemplateLocation: 'non/existing/path.template',
    };
    await ExecuteConvertWrite(executorOptions);
    await expect(localConverter.Convert).not.toBeCalled();
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('non/existing/path.template not found or you do not have access to the file'),
      );
  });
  test('script template without script catalog', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      collectionPreRequestScriptTemplateLocation: 'exists',
    };
    await ExecuteConvertWrite(executorOptions);
    await expect(localConverter.Convert).not.toBeCalled();
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Pre request script template is only usable along with scripts'),
      );
  });
});

describe('ExecuteCreateWriteSets', () => {
  beforeEach(() => {
    converterShouldFail = true;
  });
  test('sets config location does not exist', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'non-existing-file',
      setsConfigFileLocation: 'notExists',
    };
    await ExecuteCreateWriteSets(executorOptions);
    expect(converter.CreateSets).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('file notExists not found or you do not have access to the file'),
      );
  });
  test('successfully create sets', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'existingPath',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
    };
    await ExecuteCreateWriteSets(executorOptions);
    await expect(localConverter.CreateSets).toBeCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Sets created'));
  });
  test('successfully create sets in current location', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'existingPath',
      setsConfigFileLocation: 'existingSetsConfigPath',
    };
    await ExecuteCreateWriteSets(executorOptions);
    await expect(localConverter.CreateSets).toBeCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Sets created'));
  });
  test('successfully create sets in current location', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      setsConfigFileLocation: 'existingSetsConfigPath',
    };
    await ExecuteCreateWriteSets(executorOptions);
    await expect(localConverter.CreateSets).toBeCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Sets created'));
  });
  test('successfully create sets with basic auth', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
      authHeaderBasicAuthUsername: 'username',
      authHeaderBasicAuthPassword: 'password',
    };
    await ExecuteCreateWriteSets(executorOptions);
    await expect(localConverter.CreateSets).toBeCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Sets created'));
  });
  test('successfully create sets with x api key auth', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
      authHeaderXApiKey: 'api-key',
    };
    await ExecuteCreateWriteSets(executorOptions);
    await expect(localConverter.CreateSets).toBeCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Sets created'));
  });
  test('successfully create sets with bearer token auth', async () => {
    converterShouldFail = false;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
      authHeaderBearerToken: 'token',
    };
    await ExecuteCreateWriteSets(executorOptions);
    await expect(localConverter.CreateSets).toBeCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(consoleSuccessTextHelper('Sets created'));
  });

  test('input collection does not exist', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'nonExistingFile',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
    };
    ExecuteCreateWriteSets(executorOptions);
    expect(converter.CreateSets).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('nonExistingFile not found or you do not have access to the file'),
      );
  });
  test('basic auth password is missing', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
      authHeaderBasicAuthUsername: 'username',
    };
    ExecuteCreateWriteSets(executorOptions);
    expect(converter.CreateSets).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Basic auth password is missing'),
      );
  });
  test('basic auth username is missing', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
      authHeaderBasicAuthPassword: 'password',
    };
    ExecuteCreateWriteSets(executorOptions);
    expect(converter.CreateSets).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Basic auth username is missing'),
      );
  });
  test('basic auth cannot be used with x api key', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
      authHeaderBasicAuthUsername: 'username',
      authHeaderBasicAuthPassword: 'password',
      authHeaderXApiKey: 'api-key',
    };
    ExecuteCreateWriteSets(executorOptions);
    expect(converter.CreateSets).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Please use either basic auth, X-API-KEY or Bearer token'),
      );
  });
  test('basic auth cannot be used with bearer token', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
      authHeaderBasicAuthUsername: 'username',
      authHeaderBasicAuthPassword: 'password',
      authHeaderBearerToken: 'token',
    };
    ExecuteCreateWriteSets(executorOptions);
    expect(converter.CreateSets).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Please use either basic auth, X-API-KEY or Bearer token'),
      );
  });
  test('all authentication types cannot be used simultaneously', () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'url',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
      authHeaderBasicAuthUsername: 'username',
      authHeaderBasicAuthPassword: 'password',
      authHeaderBearerToken: 'token',
      authHeaderXApiKey: 'api-key',
    };
    ExecuteCreateWriteSets(executorOptions);
    expect(converter.CreateSets).not.toBeCalled();
    expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Please use either basic auth, X-API-KEY or Bearer token'),
      );
  });
  test('fail to get remote file', async () => {
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'urlReject',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',

    };
    await ExecuteCreateWriteSets(executorOptions);
    await expect(converter.CreateSets).not.toBeCalled();
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Failed to get urlReject. Reason: Error: rejected'),
      );
  });
  test('fail to create sets', async () => {
    converterShouldFail = true;
    const localConverter = new Converter({ fail: false } as unknown as IOptions);
    const executorOptions: IExecutorOptions = {
      inputFileLocation: 'existingPath',
      outputPath: 'output',
      setsConfigFileLocation: 'existingSetsConfigPath',
    };
    await ExecuteCreateWriteSets(executorOptions);
    await expect(localConverter.CreateSets).rejects.toStrictEqual(new Error('rejected'));
    await expect(mockConsoleError)
      .toHaveBeenCalledWith(
        consoleErrorTextHelper('Failed to create sets. Reason Error: rejected'),
      );
  });
});
