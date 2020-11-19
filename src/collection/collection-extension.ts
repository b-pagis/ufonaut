import {
  Collection, Item, Event, EventDefinition, Script, RequestAuthDefinition, RequestAuth,
} from 'postman-collection';
import { LettersOnlyWithDash } from '../utils/string.util';
import {
  EndpointInfo, OrderList, PreRequestTestScript, CollectionAuth,
} from '../converter/converter.model';
import { Interpolate } from '../template/template';

/**
 * Function to get normalized string from HTTP method and path to resource combination.
 *
 * @param method HTTP method, e.g. GET
 * @param path Path to resource, e.g. /store
 *
 * @returns {string} normalized HTTP method and path to resource combination
 */
function getNormalizedEndpointName(method: string, path: string): string {
  return `${method}-${LettersOnlyWithDash(path)}`.toLocaleLowerCase();
}

/**
 * Prototype function of {@link Collection | Collection} that returns array of
 * {@link EndpointInfo} containing both {@link methodPath | actual} and
 * normalized endpoint information.
 *
 * @returns Array of {@link EndpointInfo}
 */
Collection.prototype.ListEndpoints = function ListEndpoints(): EndpointInfo[] {
  const endpoints: EndpointInfo[] = new Array<EndpointInfo>();

  // eslint-disable-next-line no-restricted-syntax
  this.forEachItem((item: Item) => {
    const pmItemPath = (item.request.url.path) ? item.request.url.path.join('/').toLowerCase() : 'undefined';
    endpoints.push({
      actual: { method: item.request.method.toLowerCase(), path: pmItemPath },
      normalized: getNormalizedEndpointName(item.request.method, pmItemPath),
    });
  });
  return endpoints;
};

Collection.prototype.Rename = function Rename(name: string): void {
  if (name) {
    this.name = name;
  }
};

/**
 * Prototype of {@link Collection | Collection} that gives option to specify
 * custom endpoint normalization function.
 * @property {function(string, string): string} - function that accepts two
 * strings and returns a string
 *
 */
Collection.prototype.NormalizedEndpointNameFn = (method: string, path: string) => getNormalizedEndpointName(method, path);

function getEventWithScript(script: string, type: string): Event {
  const rawScript = new Script(script);
  rawScript.type = 'text/javascript';

  const rawEvent: EventDefinition = {
    listen: type,
    script: rawScript,
  };

  return new Event(rawEvent);
}

function addScriptsToItem(pmColItem: Item, scripts: PreRequestTestScript[], template?: string): Item {
  const pmItemPath = (pmColItem.request.url.path) ? pmColItem.request.url.path.join('/').toLowerCase() : undefined;
  if (!pmItemPath) {
    return pmColItem;
  }
  const normalizedName = getNormalizedEndpointName(pmColItem.request.method, pmItemPath);

  const result = scripts.find((s) => s.normalizedName === normalizedName);

  if (!result) {
    return pmColItem;
  }

  if (template && pmColItem.request.body) {
    const originalBody = pmColItem.request.body.raw as string;
    pmColItem.request.body.raw = '{{requestBody}}';
    const preRqScript = Interpolate(template, { requestBody: originalBody, scriptContent: result.preRequestScriptContent });
    result.preRequestScriptContent = preRqScript;
  }

  if (result.preRequestScriptContent) pmColItem.events.add(getEventWithScript(result.preRequestScriptContent, 'prerequest'));
  if (result.testScriptContent) pmColItem.events.add(getEventWithScript(result.testScriptContent, 'test'));

  return pmColItem;
}

Collection.prototype.AddScripts = function AddScripts(scripts: PreRequestTestScript[], template?: string): void {
  if (!scripts || scripts.length === 0) {
    throw new Error('Scripts not provided or provided config contains no script entries');
  }

  this.forEachItem((i: Item) => {
    addScriptsToItem(i, scripts, template);
  });
};

Collection.prototype.Order = function Order(orderList: OrderList, discardNotInOrderList: boolean): void {
  if (!orderList || orderList.order.length === 0) {
    throw new Error('Order list not provided or provided config contains no order entries');
  }
  const pmOrderedColItems: Item[] = [];
  const pmOrderedItemsIdList: string[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const orderedListItem of orderList.order) {
    this.forEachItem((item: Item) => {
      const pmItemPath = (item.request.url.path) ? item.request.url.path.join('/').toLowerCase() : 'undefined';
      if (orderedListItem.method.toLowerCase() === item.request.method.toLowerCase() && orderedListItem.path.toLowerCase() === pmItemPath) {
        pmOrderedColItems.push(item);
        pmOrderedItemsIdList.push(item.id);
      }
    });
  }
  if (!discardNotInOrderList) {
    this.forEachItem((item: Item) => {
      if (!pmOrderedItemsIdList.includes(item.id)) {
        pmOrderedColItems.push(item);
      }
    });
  }

  this.items.repopulate(pmOrderedColItems);
};

Collection.prototype.SetAuthorization = function SetAuthorization(auth: RequestAuthDefinition, forceAuth: boolean): void {
  this.forEachItem((item: Item) => {
    if ((item.request.auth && item.request.auth.type !== 'noauth') || forceAuth) {
      // eslint-disable-next-line no-param-reassign
      item.request.auth = new RequestAuth(auth);
    }
  });
};

Collection.prototype.GetAuthDefinition = function GetAuthDefinition(auth: CollectionAuth): RequestAuthDefinition {
  const requestAuthDefinition: RequestAuthDefinition = {};
  switch (auth.type) {
    case 'basic':

      if (!auth.basic || !auth.basic.password || !auth.basic.username) {
        throw new Error('Username or password is missing');
      }

      requestAuthDefinition.type = auth.type;
      requestAuthDefinition.basic = [
        { key: 'password', value: auth.basic.password, type: 'string' },
        { key: 'username', value: auth.basic.username, type: 'string' },
      ];
      break;
    case 'bearer':
      if (!auth.bearer?.token) {
        throw new Error('Bearer token is missing');
      }

      requestAuthDefinition.type = auth.type;
      requestAuthDefinition.bearer = [
        { key: 'token', value: auth.bearer.token, type: 'string' },
      ];

      break;
    case 'apikey':
      if (!auth.apikey || !auth.apikey.value || !auth.apikey.key || !auth.apikey.location) {
        throw new Error('Api key, key value or key location is missing');
      }

      requestAuthDefinition.type = auth.type;
      requestAuthDefinition.apikey = [
        { key: 'in', value: auth.apikey.location, type: 'string' },
        { key: 'value', value: auth.apikey.value, type: 'string' },
        { key: 'key', value: auth.apikey.key, type: 'string' },
      ];
      break;

    default:
      throw new Error(`Unsupported auth type: ${auth.type}`);
  }

  return requestAuthDefinition;
};
