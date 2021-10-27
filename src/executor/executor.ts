import { Collection } from 'postman-collection';
import { AxiosRequestHeaders, AxiosResponse } from 'axios';
import { sep } from 'path';
import {
  CollectionSet,
  IOptions as IConverterOptions,
} from '../converter/converter.model';
import { Converter } from '../converter/converter';
import {
  WriteFile, Exists, GetFile, GetScriptsContent,
} from '../utils/file.util';
import { IsURL, GetRemoteFile, GetAuthHeader } from '../utils/http.util';
import { ShowError, ShowSuccess } from '../utils/logger.util';
import { ScriptsFilePath } from '../models/paths';
import { SupportedFileTypes, IOptions as IExecutorOptions } from './executor.model';
import { AuthHeaderType, ApiKeyLocation } from '../utils/http.util.model';

function convert(options: IConverterOptions, outputFileLocation: string): void {
  const converter = new Converter(options);

  converter.Convert().then((collection: Collection) => {
    if (options.orderConfig) {
      collection.Order(options.orderConfig, false);
    }

    if (options.scripts) {
      collection.AddScripts(options.scripts, options.preRequestScriptTemplate);
    }

    if (options.collectionName) {
      collection.Rename(options.collectionName);
    }

    if (options.auth && options.auth.type) {
      try {
        collection.SetAuthorization(collection.GetAuthDefinition(options.auth), options.auth.forced);
      } catch (error) {
        ShowError(`Failed to set auth to collection. Reason: ${error}`);
        return;
      }
    }

    WriteFile(outputFileLocation, JSON.stringify(collection));
    ShowSuccess('Conversion complete');
  }).catch((err: Error) => {
    ShowError(err);
  });
}

export function ExecuteConvertWrite(executorOptions: IExecutorOptions): void {
  const converterOptions: Partial<IConverterOptions> = {};

  // Check for collection rename option
  if (executorOptions.collectionName) converterOptions.collectionName = executorOptions.collectionName;

  // Check for ordering collection option
  if (executorOptions.orderConfigFileLocation) {
    if (!Exists(executorOptions.orderConfigFileLocation)) {
      ShowError(`${executorOptions.orderConfigFileLocation} not found or you do not have access to the file`);
      return;
    }

    const orderConfigContent = GetFile(executorOptions.orderConfigFileLocation);

    try {
      converterOptions.orderConfig = JSON.parse(orderConfigContent);
    } catch (err) {
      ShowError(`Failed to parse order config file ${executorOptions.orderConfigFileLocation} content. Reason: ${err}`);
      return;
    }
  }

  if (!executorOptions.scriptsCatalogLocation && executorOptions.collectionPreRequestScriptTemplateLocation) {
    ShowError('Pre request script template is only usable along with scripts');
    return;
  }

  // Check for scripts option
  if (executorOptions.scriptsCatalogLocation) {
    if (!Exists(executorOptions.scriptsCatalogLocation)
      && (!Exists(`${executorOptions.scriptsCatalogLocation}${sep}${ScriptsFilePath.TEST_FILES_PATH}`)
        && !Exists(`${executorOptions.scriptsCatalogLocation}${sep}${ScriptsFilePath.PRE_REQUEST_FILES_PATH}`))) {
      ShowError(`${executorOptions.scriptsCatalogLocation} not found or there are no [test] and [pre-request] catalogs, or you do not have access to it`);
      return;
    }
    converterOptions.scripts = GetScriptsContent(executorOptions.scriptsCatalogLocation);

    if (executorOptions.collectionPreRequestScriptTemplateLocation) {
      if (!Exists(executorOptions.collectionPreRequestScriptTemplateLocation)) {
        ShowError(`${executorOptions.collectionPreRequestScriptTemplateLocation} not found or you do not have access to the file`);
        return;
      }
      converterOptions.preRequestScriptTemplate = GetFile(executorOptions.collectionPreRequestScriptTemplateLocation);
    }
  }

  // Check for collection's auth option
  if (executorOptions.collectionAuthType) {
    converterOptions.auth = {
      type: executorOptions.collectionAuthType as AuthHeaderType,
      forced: executorOptions.collectionForcedAuth as boolean,
      basic: {
        username: executorOptions.collectionBasicAuthUsername as string,
        password: executorOptions.collectionBasicAuthPassword as string,
      },
      apikey: {
        key: executorOptions.collectionApiKeyAuthKey as string | 'X-API-KEY',
        value: executorOptions.collectionApiKeyAuthValue as string,
        location: (executorOptions.collectionApiKeyAuthLocation) ? executorOptions.collectionApiKeyAuthLocation as ApiKeyLocation : ApiKeyLocation.HEADER,
      },
      bearer: {
        token: executorOptions.collectionBearerAuthToken as string,
      },
    };
  }

  if (!IsURL(executorOptions.inputFileLocation)) {
    if (!Exists(executorOptions.inputFileLocation)) {
      ShowError(`${executorOptions.inputFileLocation} not found or you do not have access to the file`);
      return;
    }
    converterOptions.openApiDocContent = GetFile(executorOptions.inputFileLocation);
    convert(converterOptions as IConverterOptions, executorOptions.outputPath || '');
    return;
  }

  if ((executorOptions.authHeaderBasicAuthUsername || executorOptions.authHeaderBasicAuthPassword) && executorOptions.authHeaderXApiKey) {
    ShowError('Please use either basic auth, X-API-KEY or Bearer token');
    return;
  }

  // Check auth headers
  if (executorOptions.authHeaderBasicAuthUsername && !executorOptions.authHeaderBasicAuthPassword) {
    ShowError('Basic auth password is missing');
    return;
  }

  if (!executorOptions.authHeaderBasicAuthUsername && executorOptions.authHeaderBasicAuthPassword) {
    ShowError('Basic auth username is missing');
    return;
  }

  let httpHeaders: AxiosRequestHeaders = {};

  if (executorOptions.authHeaderBasicAuthUsername && executorOptions.authHeaderBasicAuthPassword) {
    httpHeaders = GetAuthHeader(executorOptions.authHeaderBasicAuthUsername, executorOptions.authHeaderBasicAuthPassword, '', '', AuthHeaderType.BASIC);
  }

  if (executorOptions.authHeaderXApiKey) {
    httpHeaders = GetAuthHeader('', '', executorOptions.authHeaderXApiKey, '', AuthHeaderType.API_KEY);
  }

  if (executorOptions.authHeaderBearerToken) {
    httpHeaders = GetAuthHeader('', '', '', executorOptions.authHeaderBearerToken, AuthHeaderType.BEARER);
  }

  GetRemoteFile(executorOptions.inputFileLocation, httpHeaders).then((response: AxiosResponse) => {
    converterOptions.openApiDocContent = response.data;
    convert(converterOptions as IConverterOptions, executorOptions.outputPath || '');
  }).catch((err: Error) => {
    ShowError(`Failed to get ${executorOptions.inputFileLocation}. Reason: ${err}`);
  });
}

function createSets(options: IConverterOptions, outputCatalogLocation: string): void {
  const converter: Converter = new Converter(options);

  converter.CreateSets().then((sets: CollectionSet[]) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const set of sets) {
      WriteFile(`${outputCatalogLocation}${sep}${set.name}.json`, JSON.stringify(set.collection));
    }
    ShowSuccess('Sets created');
  }).catch((err: Error) => {
    ShowError(`Failed to create sets. Reason ${err}`);
  });
}

export function ExecuteCreateWriteSets(executorOptions: IExecutorOptions): void {
  const converterOptions: Partial<IConverterOptions> = {};

  if (!Exists(executorOptions.setsConfigFileLocation)) {
    ShowError(`file ${executorOptions.setsConfigFileLocation} not found or you do not have access to the file`);
    return;
  }
  const setsConfigContent = GetFile(executorOptions.setsConfigFileLocation as string);
  converterOptions.setsConfig = JSON.parse(setsConfigContent);

  if (!IsURL(executorOptions.inputFileLocation)) {
    if (!Exists(executorOptions.inputFileLocation)) {
      ShowError(`${executorOptions.inputFileLocation} not found or you do not have access to the file`);
      return;
    }
    converterOptions.openApiDocContent = GetFile(executorOptions.inputFileLocation);
    createSets(converterOptions as IConverterOptions, executorOptions.outputPath || '');
    return;
  }

  // Check auth headers
  if (executorOptions.authHeaderBasicAuthUsername && !executorOptions.authHeaderBasicAuthPassword) {
    ShowError('Basic auth password is missing');
    return;
  }

  if (!executorOptions.authHeaderBasicAuthUsername && executorOptions.authHeaderBasicAuthPassword) {
    ShowError('Basic auth username is missing');
    return;
  }

  if (
    (executorOptions.authHeaderBasicAuthUsername || executorOptions.authHeaderBasicAuthPassword)
    && (executorOptions.authHeaderXApiKey || executorOptions.authHeaderBearerToken)) {
    ShowError('Please use either basic auth, X-API-KEY or Bearer token');
    return;
  }

  let httpHeaders: AxiosRequestHeaders = {};

  if (executorOptions.authHeaderBasicAuthUsername && executorOptions.authHeaderBasicAuthPassword) {
    httpHeaders = GetAuthHeader(executorOptions.authHeaderBasicAuthUsername, executorOptions.authHeaderBasicAuthPassword, '', '', AuthHeaderType.BASIC);
  }

  if (executorOptions.authHeaderXApiKey) {
    httpHeaders = GetAuthHeader('', '', executorOptions.authHeaderXApiKey, '', AuthHeaderType.API_KEY);
  }

  if (executorOptions.authHeaderBearerToken) {
    httpHeaders = GetAuthHeader('', '', '', executorOptions.authHeaderBearerToken, AuthHeaderType.BEARER);
  }

  GetRemoteFile(executorOptions.inputFileLocation, httpHeaders).then((response: AxiosResponse) => {
    converterOptions.openApiDocContent = response.data;
    createSets(converterOptions as IConverterOptions, executorOptions.outputPath || '');
  }).catch((err: Error) => {
    ShowError(`Failed to get ${executorOptions.inputFileLocation}. Reason: ${err}`);
  });
}

function consolePrint(collection: Collection, displayNormalized: boolean) {
  // eslint-disable-next-line no-restricted-syntax
  for (const epInfo of collection.ListEndpoints()) {
    if (displayNormalized) {
      // eslint-disable-next-line no-console
      console.log(`${epInfo.actual.method} ${epInfo.actual.path} | ${epInfo.normalized}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`${epInfo.actual.method} ${epInfo.actual.path}`);
    }
  }
}

function getMarkdown(collection: Collection, displayNormalized: boolean): string {
  const header: string = (displayNormalized) ? '|Method|Path|Normalized|' : '|Method|Path|';
  const subheader: string = (displayNormalized) ? '|---|---|---|' : '|---|---|';
  let tableContent = '';
  // eslint-disable-next-line no-restricted-syntax
  for (const epInfo of collection.ListEndpoints()) {
    if (displayNormalized) {
      tableContent += `|${epInfo.actual.method}|${epInfo.actual.path}|${epInfo.normalized}|\n`;
    } else {
      tableContent += `|${epInfo.actual.method}|${epInfo.actual.path}|\n`;
    }
  }
  return `${header}\n${subheader}\n${tableContent}`;
}

function getCSV(collection: Collection, displayNormalized: boolean) {
  let content = '';
  // eslint-disable-next-line no-restricted-syntax
  for (const epInfo of collection.ListEndpoints()) {
    if (displayNormalized) {
      content += `${epInfo.actual.method};${epInfo.actual.path};${epInfo.normalized}\n`;
    } else {
      content += `${epInfo.actual.method};${epInfo.actual.path}\n`;
    }
  }
  return content;
}

function listEndpoints(
  options: IConverterOptions,
  displayNormalized: boolean,
  outputFileType: SupportedFileTypes | string | undefined,
  outputFileLocation: string,
): void {
  const converter = new Converter(options);

  converter.Convert().then((collection: Collection) => {
    switch (outputFileType) {
      case SupportedFileTypes.CSV:
        WriteFile(outputFileLocation, getCSV(collection, displayNormalized));
        ShowSuccess('CSV file created');
        break;
      case SupportedFileTypes.MD:
        WriteFile(outputFileLocation, getMarkdown(collection, displayNormalized));
        ShowSuccess('Markdown file created');
        break;
      default:
        consolePrint(collection, displayNormalized);
        break;
    }
  }).catch((err: Error) => {
    ShowError(`Failed to convert open API file to postman collection. Reason ${err}`);
  });
}

export function ExecuteListEndpoints(executorOptions: IExecutorOptions): void {
  const converterOptions: Partial<IConverterOptions> = {};

  if (!IsURL(executorOptions.inputFileLocation)) {
    if (!Exists(executorOptions.inputFileLocation)) {
      ShowError(`${executorOptions.inputFileLocation} not found or you do not have access to the file`);
      return;
    }
    converterOptions.openApiDocContent = GetFile(executorOptions.inputFileLocation);
    listEndpoints(
      converterOptions as IConverterOptions,
      executorOptions.displayNormalized || false,
      executorOptions.outputFileType, executorOptions.outputPath || '',
    );
    return;
  }

  // Check auth headers
  if (executorOptions.authHeaderBasicAuthUsername && !executorOptions.authHeaderBasicAuthPassword) {
    ShowError('Basic auth password is missing');
    return;
  }

  if (!executorOptions.authHeaderBasicAuthUsername && executorOptions.authHeaderBasicAuthPassword) {
    ShowError('Basic auth username is missing');
    return;
  }

  if ((executorOptions.authHeaderBasicAuthUsername || executorOptions.authHeaderBasicAuthPassword)
    && (executorOptions.authHeaderXApiKey || executorOptions.authHeaderBearerToken)) {
    ShowError('Please use either basic auth, X-API-KEY or Bearer token');
    return;
  }

  let httpHeaders: AxiosRequestHeaders = {};

  if (executorOptions.authHeaderBasicAuthUsername && executorOptions.authHeaderBasicAuthPassword) {
    httpHeaders = GetAuthHeader(executorOptions.authHeaderBasicAuthUsername, executorOptions.authHeaderBasicAuthPassword, '', '', AuthHeaderType.BASIC);
  }

  if (executorOptions.authHeaderXApiKey) {
    httpHeaders = GetAuthHeader('', '', executorOptions.authHeaderXApiKey, '', AuthHeaderType.API_KEY);
  }

  if (executorOptions.authHeaderBearerToken) {
    httpHeaders = GetAuthHeader('', '', '', executorOptions.authHeaderBearerToken, AuthHeaderType.BEARER);
  }

  GetRemoteFile(executorOptions.inputFileLocation, httpHeaders).then((response: AxiosResponse) => {
    converterOptions.openApiDocContent = response.data;
    listEndpoints(
      converterOptions as IConverterOptions,
      executorOptions.displayNormalized || false,
      executorOptions.outputFileType,
      executorOptions.outputPath || '',
    );
  }).catch((err: Error) => {
    ShowError(`Failed to get ${executorOptions.inputFileLocation}. Reason: ${err}`);
  });
}
