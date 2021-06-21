/* eslint-disable class-methods-use-this */
import {
  Collection, Item, CollectionDefinition,
} from 'postman-collection';
import * as postmanConverter from 'openapi-to-postmanv2';
import { sep } from 'path';

import { IsArray, IsObject } from '../utils/object.util';
import { Capitalize } from '../utils/string.util';
import {
  IOptions, OrderList, SetsList, CollectionSet, PostmanConvertResult, PreRequestTestScript,
} from './converter.model';
import '../collection/collection-extension';
import { Exists, GetFile } from '../utils/file.util';
import { ScriptsFilePath } from '../models/paths';
import { LoadTemplate } from '../template/template';

export class Converter {
  private options: IOptions;

  private unquoteRegExp = new RegExp(/"<unquote>[^"]+"/g);

  constructor(options: IOptions) {
    this.options = options;
  }

  public Convert(): Promise<Collection> {
    return new Promise<Collection>((resolve, reject) => {
      this.GetCollectionDefinition().then((postmanCollection: CollectionDefinition) => {
        let pmCol = new Collection(postmanCollection);
        pmCol = this.useKeysAsValues(pmCol);
        pmCol = this.paramsUseKeysAsValues(pmCol);
        resolve(pmCol);
      }).catch((err: Error) => {
        reject(err);
      });
    });
  }

  public GetCollectionDefinition(): Promise<CollectionDefinition> {
    return new Promise<CollectionDefinition>(
      (resolve, reject) => {
        this.convertToPostmanCollection(this.options.openApiDocContent).then((postmanCollection: CollectionDefinition) => {
          resolve(postmanCollection);
        }).catch(
          (err: Error) => {
            reject(err);
          },
        );
      },
    );
  }

  private isSetsConfig(obj: any): boolean {
    return obj && obj.sets && IsArray(obj.sets) && (obj.sets as Array<Record<string, unknown>>).length > 0;
  }

  public CreateSets(): Promise<CollectionSet[]> {
    return new Promise<CollectionSet[]>(
      (resolve, reject) => {
        if (!this.isSetsConfig(this.options.setsConfig)) {
          reject(new Error('Sets config is undefined or is incorrect'));
          return;
        }
        const collections: CollectionSet[] = new Array<CollectionSet>();

        this.GetCollectionDefinition().then((postmanCollection: CollectionDefinition) => {
          // eslint-disable-next-line no-restricted-syntax
          for (const set of (this.options.setsConfig as SetsList).sets) {
            let pmCol: Collection = new Collection(postmanCollection);

            pmCol = this.useKeysAsValues(pmCol);
            pmCol = this.paramsUseKeysAsValues(pmCol);
            pmCol.Rename(set.collectionName);

            if (set.auth) {
              try {
                pmCol.SetAuthorization(pmCol.GetAuthDefinition(set.auth), set.auth.forced);
              } catch (error) {
                reject(error);
                return;
              }
            }

            if (set.scriptsPath) {
              const scripts: PreRequestTestScript[] = new Array<PreRequestTestScript>();
              const endpoints = pmCol.ListEndpoints();
              // eslint-disable-next-line no-restricted-syntax
              for (const endpoint of endpoints) {
                const preRequestFilePath = `${set.scriptsPath}${sep}${ScriptsFilePath.PRE_REQUEST_FILES_PATH}${sep}${endpoint.normalized}.js`;
                const testFilePath = `${set.scriptsPath}${sep}${ScriptsFilePath.TEST_FILES_PATH}${sep}${endpoint.normalized}.js`;
                const script: PreRequestTestScript = {
                  normalizedName: endpoint.normalized,
                  testScriptContent: Exists(testFilePath) ? GetFile(testFilePath) : '',
                  preRequestScriptContent: Exists(preRequestFilePath) ? GetFile(preRequestFilePath) : '',
                };
                scripts.push(script);
              }
              if (set.template && set.template.preRequestTemplateFilePath) {
                pmCol.AddScripts(scripts, LoadTemplate(set.template.preRequestTemplateFilePath));
              }
            }
            const orderList: OrderList = { order: set.order };
            pmCol.Order(orderList, true);
            collections.push({ name: set.collectionName, collection: pmCol });
            resolve(collections);
          }
        }).catch((err: Error) => {
          reject(err);
        });
      },
    );
  }

  /**
   * Converts open api document to postman collection and returns CollectionDefinition
   * @param openApiDoc stringified open api document
   */
  private convertToPostmanCollection(openApiDoc: string): Promise<CollectionDefinition> {
    return new Promise((resolve, reject) => {
      postmanConverter.convert({ type: 'string', data: openApiDoc }, {
        requestParametersResolution: 'Schema',
        exampleParametersResolution: 'Schema'
      }, (err: Error, conversionResult: PostmanConvertResult) => {
        if (err) {
          reject(err);
        }

        if (!conversionResult.result) {
          reject(conversionResult.reason);
        }

        if (conversionResult.result) {
          if (conversionResult.output.length === 1) {
            resolve(conversionResult.output[0].data);
          }
          reject(new Error('Error while getting results. Conversion output array is not equal to 1'));
        }
      });
    });
  }

  private changeValuesToKeys(jsonObject: Record<string, unknown> | unknown, parentKey?: string) {
    if (!IsObject(jsonObject as Record<string, unknown>)) {
      return jsonObject;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(jsonObject as Record<string, unknown>)) {
      // change simple keys
      if (!IsObject((jsonObject as Record<string, unknown>)[key] as Record<string, unknown>)) {
        (jsonObject as Record<string, unknown>)[key] = (parentKey) ?
          `${this.addUnquotePlaceholder((jsonObject as Record<string, unknown>)[key])}{{${parentKey}${Capitalize(key)}}}` :
          `${this.addUnquotePlaceholder((jsonObject as Record<string, unknown>)[key])}{{${key}}}`;
      }

      // deal with objects
      if (IsObject((jsonObject as Record<string, unknown>)[key] as Record<string, unknown>)) {
        const newParentKey = (parentKey) ? `${parentKey}${Capitalize(key)}` : `${key}`;
        this.changeValuesToKeys((jsonObject as Record<string, unknown>)[key], newParentKey);
      }
    }
    return jsonObject;
  }

  private addUnquotePlaceholder(type: string | unknown): string {
    if (type === '<long>' || type === '<integer>' || type === '<number>' || type === '<boolean>') {
      return '<unquote>'
    }
    return ''
  }

  private unquoteReplacer(json: string): string | undefined {
    const c = json.replace(this.unquoteRegExp, (a: string): string => a.replace(/"/g, '').replace('<unquote>', ''))
    return c
  }

  // UseKeysAsValues changes request body values to keys, so it would be possible
  // to use them as environment variables
  private useKeysAsValues(postmanCollection: Collection): Collection {
    postmanCollection.forEachItem((i: Item) => {
      if (i.request.body && i.request.body.raw) {
        i.request.body.raw = this.unquoteReplacer(JSON.stringify(this.changeValuesToKeys(JSON.parse(i.request.body.raw)), null, 2));
      }
    });
    return postmanCollection;
  }

  // ParamsUseKeysAsValues changes request params values to keys, so it would be possible
  // to use them as environment variables
  private paramsUseKeysAsValues(postmanCollection: Collection): Collection {
    postmanCollection.forEachItem((i: Item) => {
      if (i.request.url.variables && (i.request.url.variables.count() > 0)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const v of i.request.url.variables.all()) {
          v.value = `{{${v.key}}}`;
        }
      }
      if (i.request.url.query && (i.request.url.query.count() > 0)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const v of i.request.url.query.all()) {
          v.value = `{{${v.key}}}`;
        }
      }
    });

    return postmanCollection;
  }
}
