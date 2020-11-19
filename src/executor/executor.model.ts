import { AuthHeaderType } from '../utils/http.util.model';

export enum SupportedFileTypes {
  CSV = 'csv',
  MD = 'md'
}

export interface IOptions{
  inputFileLocation: string;
  outputPath?: string;
  scriptsCatalogLocation?: string;
  orderConfigFileLocation?: string;
  setsConfigFileLocation?: string,
  collectionName?: string;
  authHeaderBasicAuthUsername?: string;
  authHeaderBasicAuthPassword?: string;
  authHeaderXApiKey?: string;
  authHeaderBearerToken?: string;
  collectionAuthType?: AuthHeaderType | string;
  collectionBasicAuthUsername?: string;
  collectionBasicAuthPassword?: string;
  collectionApiKeyAuthKey?: string;
  collectionApiKeyAuthValue?: string;
  collectionApiKeyAuthLocation?: string;
  collectionBearerAuthToken?: string;
  collectionForcedAuth?: boolean;
  collectionPreRequestScriptTemplateLocation?: string;
  outputFileType?: SupportedFileTypes | string,
  displayNormalized?: boolean,
}
