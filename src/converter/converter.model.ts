import { Collection, CollectionDefinition } from 'postman-collection';
import { ApiKeyLocation } from '../utils/http.util.model';

type methodPath = {
  method: string
  path: string
}

export type OrderList = {
  order: methodPath[];
}

type setConfig = {
  collectionName: string;
  scriptsPath: string;
  order: methodPath[];
  auth: CollectionAuth
  template?: ScriptTemplate
}

export type SetsList = {
  sets: setConfig[];
}

export type CollectionSet = {
  name: string,
  collection: Collection
}

export type EndpointInfo = {
  actual: methodPath;
  normalized: string;
}

interface postmanConverterOutput {
  type: string
  data: CollectionDefinition
}

export interface PostmanConvertResult {
  result: boolean,
  reason: string
  output: postmanConverterOutput[]
}

export type PreRequestTestScript = {
  normalizedName: string
  preRequestScriptContent: string
  testScriptContent: string
}

type basicAuth = {
  username: string
  password: string
}
type apiKeyAuth = {
  key: string
  value: string
  location: ApiKeyLocation
}
type bearerAuth = {
  token: string
}
export interface CollectionAuth {
  type?:
  | 'basic'
  | 'apikey'
  | 'bearer'
  basic?: basicAuth;
  apikey?: apiKeyAuth;
  bearer?: bearerAuth;
  forced: boolean;
}

export interface ScriptTemplate {
  preRequestTemplateFilePath: string
}

export interface IOptions {
  openApiDocContent: string,
  scripts?: PreRequestTestScript[],
  preRequestScriptTemplate?: string
  orderConfig?: OrderList,
  setsConfig?: SetsList,
  collectionName?: string
  auth?: CollectionAuth,
  template?: ScriptTemplate
}
