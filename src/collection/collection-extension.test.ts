import {
  Collection, Item, Request, Url, RequestAuthDefinition, RequestAuth, RequestBodyDefinition,
} from 'postman-collection';
import './collection-extension';

import {
  EndpointInfo, PreRequestTestScript, OrderList, CollectionAuth,
} from '../converter/converter.model';
import { ApiKeyLocation } from '../utils/http.util.model';

describe('Collection.Rename', () => {
  const col: Collection = new Collection();
  beforeEach(() => {
    col.name = 'The Name';
  });
  test('successfully rename collection', () => {
    expect(col.name).toEqual('The Name');
    col.Rename('Changed');
    expect(col.name).toEqual('Changed');
  });
  test('empty value does not change collection name', () => {
    col.Rename('');
    expect(col.name).toEqual('The Name');
  });
});
describe('Collection.ListEndpoints', () => {
  test('get endpoint list with normalized name', () => {
    const col = new Collection();

    const requests: Request[] = [
      new Request({ method: 'post', url: 'http://local-url/pet' }),
      new Request({ method: 'get', url: 'http://local-url/store-owners' }),
      new Request({ method: 'Put', url: 'http://local-url/pet/dogs/follow/long-long-long/path' }),
      new Request({ method: 'PATCH', url: 'http://local-url/me/UPPERCASE' }),
      new Request({ method: 'PATCH', url: '' }),
      new Request({ method: 'PATCH', url: new Url('') }),
    ];
    // eslint-disable-next-line no-restricted-syntax
    for (const req of requests) {
      const item: Item = new Item({ request: req });
      col.items.append(item);
    }

    const expectedResults: EndpointInfo[] = [
      { actual: { method: 'post', path: 'pet' }, normalized: 'post-pet' },
      { actual: { method: 'get', path: 'store-owners' }, normalized: 'get-store-owners' },
      { actual: { method: 'put', path: 'pet/dogs/follow/long-long-long/path' }, normalized: 'put-petdogsfollowlong-long-longpath' },
      { actual: { method: 'patch', path: 'me/uppercase' }, normalized: 'patch-meuppercase' },
      { actual: { method: 'patch', path: 'undefined' }, normalized: 'patch-undefined' },
      { actual: { method: 'patch', path: 'undefined' }, normalized: 'patch-undefined' },
    ];

    expect(col.ListEndpoints()).toStrictEqual(expectedResults);
  });
});

describe('Collection.NormalizedEndpointNameFn', () => {
  test('function returns normalized endpoint name', () => {
    const col = new Collection();
    expect(col.NormalizedEndpointNameFn('demo', 'path/where/treasure-exists')).toBe('demo-pathwheretreasure-exists');
    col.NormalizedEndpointNameFn = (method, path) => `${method.toLocaleUpperCase()}-${path.toLocaleUpperCase()}`;
    expect(col.NormalizedEndpointNameFn('demo', 'path/where/treasure-exists')).toBe('DEMO-PATH/WHERE/TREASURE-EXISTS');
  });
});

describe('Collection.Order', () => {
  const col = new Collection();
  const requests: Request[] = [
    new Request({ method: 'post', url: 'http://local-url/pet', name: 'Order Pet' }),
    new Request({ method: 'get', url: 'http://local-url/store-owners', name: 'Store owners' }),
    new Request({ method: 'Put', url: 'http://local-url/pet/dogs/follow/long-long-long/path', name: 'Long long path' }),
    new Request({ method: 'PATCH', url: 'http://local-url/me/UPPERCASE', name: 'UpperCASE me' }),
    new Request({ method: 'PATCH', url: '', name: 'Empty url' }),
    new Request({ method: 'PATCH', url: new Url(''), name: 'empty new Url()' }),
  ];
  // eslint-disable-next-line no-restricted-syntax
  for (const req of requests) {
    const item: Item = new Item({ request: req, name: req.name });
    col.items.append(item);
  }
  test('order endpoints without discarding ones that are not in config', () => {
    const orderList = {
      order: [
        { method: 'post', path: 'pet' },
        { method: 'patch', path: 'me/uppercase' },
        { method: 'get', path: 'store-owners' },
      ],
    };

    col.Order(orderList, false);
    expect(col.items.idx(0).name).toEqual('Order Pet');
    expect(col.items.idx(1).name).toEqual('UpperCASE me');
    expect(col.items.idx(2).name).toEqual('Store owners');
    expect(col.items.idx(3).name).toEqual('Long long path');
    expect(col.items.idx(4).name).toEqual('Empty url');
    expect(col.items.idx(5).name).toEqual('empty new Url()');
  });

  test('order endpoints while discarding ones that are not in config', async () => {
    const orderList = {
      order: [
        { method: 'post', path: 'pet' },
        { method: 'patch', path: 'me/uppercase' },
        { method: 'get', path: 'store-owners' },
      ],
    };
    col.Order(orderList, true);
    expect(col.items.count()).toEqual(3);
    expect(col.items.idx(0).name).toEqual('Order Pet');
    expect(col.items.idx(1).name).toEqual('UpperCASE me');
    expect(col.items.idx(2).name).toEqual('Store owners');
  });
  test('throw error if config order config is empty', async () => {
    const orderList: OrderList = {
      order: [],
    };
    try {
      col.Order(orderList, true);
    } catch (error) {
      expect(error).toStrictEqual(Error('Order list not provided or provided config contains no order entries'));
    }
  });
});

describe('Collection.AddScripts', () => {
  let col: Collection;
  beforeEach(() => {
    col = new Collection();
    const requestBodyDefinition: RequestBodyDefinition = {
      raw: '"request":"body"',
      mode: 'raw',
    };
    const requests: Request[] = [
      new Request({
        method: 'post', url: 'http://local-url/pet', name: 'Order Pet', body: requestBodyDefinition,
      }),
      new Request({ method: 'get', url: 'http://local-url/store-owners', name: 'Store owners' }),
      new Request({ method: 'Put', url: 'http://local-url/pet/dogs/follow/long-long-long/path', name: 'Long long path' }),
      new Request({ method: 'PATCH', url: 'http://local-url/me/UPPERCASE', name: 'UpperCASE me' }),
      new Request({ method: 'get', url: '', name: 'Empty Path' }),
      new Request({ method: 'get', url: new Url(''), name: 'Empty Url' }),
    ];
    // eslint-disable-next-line no-restricted-syntax
    for (const req of requests) {
      const item: Item = new Item({ request: req, name: req.name });
      col.items.append(item);
    }
  });
  test('successfully add scripts to endpoints', async () => {
    expect(col.oneDeep('Order Pet').events.count()).toEqual(0);
    const scripts: PreRequestTestScript[] = [
      { normalizedName: 'post-pet', preRequestScriptContent: 'pre-request-script content', testScriptContent: 'test script content' },
      { normalizedName: 'get-store-owners', preRequestScriptContent: '', testScriptContent: 'test script content' },
      { normalizedName: 'patch-meuppercase', preRequestScriptContent: '', testScriptContent: '' },
      { normalizedName: 'not-found', preRequestScriptContent: 'pre-request-script content', testScriptContent: 'test script content' },
    ];

    col.AddScripts(scripts);

    expect(col.oneDeep('Order Pet').events.count()).toEqual(2);
    expect(col.oneDeep('Order Pet').events.idx(0).script.exec).not.toBeNull();
    expect(col.oneDeep('Order Pet').events.idx(1).script.exec).not.toBeNull();
    expect(col.oneDeep('Order Pet').events.idx(0).listen).toBe('prerequest');
    expect(col.oneDeep('Order Pet').events.idx(1).listen).toBe('test');
    expect(col.oneDeep('Order Pet').events.idx(0).script.exec?.toString()).toEqual('pre-request-script content');
    expect(col.oneDeep('Order Pet').events.idx(1).script.exec?.toString()).toEqual('test script content');

    expect(col.oneDeep('Store owners').events.count()).toEqual(1);
    expect(col.oneDeep('Store owners').events.idx(0).script.exec).not.toBeNull();
    expect(col.oneDeep('Store owners').events.idx(1)).toBeUndefined();
    expect(col.oneDeep('Store owners').events.idx(0).listen).toBe('test');
    expect(col.oneDeep('Store owners').events.idx(0).script.exec?.toString()).toEqual('test script content');

    expect(col.oneDeep('UpperCASE me').events.count()).toEqual(0);
    expect(col.oneDeep('UpperCASE me').events.idx(0)).toBeUndefined();
    expect(col.oneDeep('UpperCASE me').events.idx(1)).toBeUndefined();
  });

  test('replace request body with interpolation', async () => {
    const scripts: PreRequestTestScript[] = [
      { normalizedName: 'post-pet', preRequestScriptContent: 'pre-request-script content', testScriptContent: 'test script content' },
      { normalizedName: 'get-store-owners', preRequestScriptContent: '', testScriptContent: 'test script content' },
      { normalizedName: 'patch-meuppercase', preRequestScriptContent: '', testScriptContent: '' },
      { normalizedName: 'not-found', preRequestScriptContent: 'pre-request-script content', testScriptContent: 'test script content' },
    ];
    const template = `var requestBody = <%%=requestBody=%%>;

<%%=  scriptContent =%%>

pm.environment.set('requestBody', JSON.stringify(requestBody));`;

    col.AddScripts(scripts, template);

    expect(col.oneDeep('Order Pet').request.body?.raw).toBe('{{requestBody}}');
    expect(col.oneDeep('Order Pet').events.idx(0).script.exec).not.toBeNull();
    expect(col.oneDeep('Order Pet').events.idx(0).listen).toBe('prerequest');
    expect(col.oneDeep('Order Pet').events.idx(0).script.exec?.toString()).toEqual(
      'var requestBody = "request":"body";,,pre-request-script content,,pm.environment.set(\'requestBody\', JSON.stringify(requestBody));',
    );
  });

  test('throw error that scripts config is not empty', async () => {
    const scripts: PreRequestTestScript[] = [];
    try {
      col.AddScripts(scripts);
    } catch (error) {
      expect(error).toStrictEqual(Error('Scripts not provided or provided config contains no script entries'));
    }
  });
});

describe('collection.SetAuthorization', () => {
  let preparedCol = new Collection();

  beforeEach(() => {
    preparedCol = new Collection();
    const requests: Request[] = [
      new Request({
        method: 'post',
        url: 'http://local-url/pet',
        name: 'Order Pet',
        auth: {
          type: 'basic',
          basic: [
            { key: 'password', value: 'p@assw0rD', type: 'string' },
            { key: 'username', value: 'admin-user', type: 'string' }],
        },
      }),
      new Request({
        method: 'get',
        url: 'http://local-url/store-owners',
        name: 'Store owners',
        auth: {
          type: 'apikey',
          apikey: [
            { key: 'in', value: 'header', type: 'string' },
            { key: 'value', value: 'b-value', type: 'string' },
            { key: 'key', value: 'b-key', type: 'string' },
          ],
        },
      }),
      new Request({
        method: 'Put',
        url: 'http://local-url/pet/dogs/follow/long-long-long/path',
        name: 'Long long path',
        auth: {
          type: 'apikey',
          apikey: [
            { key: 'in', value: 'query', type: 'string' },
            { key: 'value', value: 'b-value', type: 'string' },
            { key: 'key', value: 'b-key', type: 'string' }],
        },
      }),
      new Request({
        method: 'PATCH',
        url: 'http://local-url/me/UPPERCASE',
        name: 'UpperCASE me',
        auth: {
          type: 'bearer',
          bearer: [
            { key: 'token', value: 'qweqweqwe', type: 'string' }],
        },
      }),
      new Request({
        method: 'get', url: '', name: 'Empty Path', auth: { type: 'noauth' },
      }),
      new Request({ method: 'get', url: new Url(''), name: 'Empty Url' }),
    ];
    // eslint-disable-next-line no-restricted-syntax
    for (const req of requests) {
      const item: Item = new Item({ request: req, name: req.name });
      preparedCol.items.append(item);
    }
  });

  test('set basic auth to all items with forced authentication', () => {
    const col = preparedCol;

    const authDefinition: RequestAuthDefinition = {
      type: 'basic',
      basic: [
        { type: 'string', value: 'new-user', key: 'username' },
        { type: 'string', value: 'new-pass', key: 'password' },
      ],
    };
    const expectedRequestAuthResult = new RequestAuth({
      type: 'basic',
      basic: [
        { type: 'string', value: 'new-user', key: 'username' },
        { type: 'string', value: 'new-pass', key: 'password' },
      ],
    });

    col.SetAuthorization(authDefinition, true);

    expect(col.oneDeep('Order Pet').getAuth().type).toBe('basic');
    expect(col.oneDeep('Order Pet').getAuth()).toEqual(expectedRequestAuthResult);

    expect(col.oneDeep('Store owners').getAuth().type).toBe('basic');
    expect(col.oneDeep('Store owners').getAuth()).toEqual(expectedRequestAuthResult);

    expect(col.oneDeep('Long long path').getAuth().type).toBe('basic');
    expect(col.oneDeep('Long long path').getAuth()).toEqual(expectedRequestAuthResult);

    expect(col.oneDeep('UpperCASE me').getAuth().type).toBe('basic');
    expect(col.oneDeep('UpperCASE me').getAuth()).toEqual(expectedRequestAuthResult);

    expect(col.oneDeep('Empty Path').getAuth().type).toBe('basic');
    expect(col.oneDeep('Empty Path').getAuth()).toEqual(expectedRequestAuthResult);

    expect(col.oneDeep('Empty Url').getAuth().type).toBe('basic');
    expect(col.oneDeep('Empty Url').getAuth()).toEqual(expectedRequestAuthResult);
  });

  test('set basic auth to all items without forced authentication', () => {
    const col = preparedCol;

    const authDefinition: RequestAuthDefinition = {
      type: 'basic',
      basic: [
        { type: 'string', value: 'new-user', key: 'username' },
        { type: 'string', value: 'new-pass', key: 'password' },
      ],
    };
    const expectedRequestAuthResult = new RequestAuth({
      type: 'basic',
      basic: [
        { type: 'string', value: 'new-user', key: 'username' },
        { type: 'string', value: 'new-pass', key: 'password' },
      ],
    });

    col.SetAuthorization(authDefinition, false);

    expect(col.oneDeep('Order Pet').getAuth().type).toBe('basic');
    expect(col.oneDeep('Order Pet').getAuth()).toEqual(expectedRequestAuthResult);

    expect(col.oneDeep('Store owners').getAuth().type).toBe('basic');
    expect(col.oneDeep('Store owners').getAuth()).toEqual(expectedRequestAuthResult);

    expect(col.oneDeep('Long long path').getAuth().type).toBe('basic');
    expect(col.oneDeep('Long long path').getAuth()).toEqual(expectedRequestAuthResult);

    expect(col.oneDeep('UpperCASE me').getAuth().type).toBe('basic');
    expect(col.oneDeep('UpperCASE me').getAuth()).toEqual(expectedRequestAuthResult);

    expect(col.oneDeep('Empty Path').getAuth().type).toBe('noauth');

    expect(col.oneDeep('Empty Url').getAuth()).toBeUndefined();
  });
});

describe('Collection.GetAuthDefinition', () => {
  const col = new Collection();
  test('return basic auth', () => {
    const auth: CollectionAuth = {
      forced: false,
      type: 'basic',
      basic: {
        username: 'new-user',
        password: 'new-pass',
      },
    };

    const expectedRequestAuthResult = [
      { type: 'string', value: 'new-pass', key: 'password' },
      { type: 'string', value: 'new-user', key: 'username' },
    ];

    const requestAuthDefinition = col.GetAuthDefinition(auth);
    expect(requestAuthDefinition.basic).toBeDefined();
    expect(requestAuthDefinition.basic).toStrictEqual(expectedRequestAuthResult);
  });
  test('return error for basic auth of missing username or password', () => {
    const auth: CollectionAuth = {
      forced: false,
      type: 'basic',
    };

    try {
      col.GetAuthDefinition(auth);
    } catch (err) {
      expect(err).toStrictEqual(Error('Username or password is missing'));
    }

    auth.basic = { username: '', password: '' };
    try {
      col.GetAuthDefinition(auth);
    } catch (err) {
      expect(err).toStrictEqual(Error('Username or password is missing'));
    }
  });

  test('return apikey in header', () => {
    const auth: CollectionAuth = {
      forced: false,
      type: 'apikey',
      apikey: { key: 'b-key', value: 'b-value', location: ApiKeyLocation.HEADER },
    };

    const expectedRequestAuthResult = [
      { key: 'in', value: 'header', type: 'string' },
      { key: 'value', value: 'b-value', type: 'string' },
      { key: 'key', value: 'b-key', type: 'string' },
    ];

    const requestAuthDefinition = col.GetAuthDefinition(auth);
    expect(requestAuthDefinition.apikey).toBeDefined();
    expect(requestAuthDefinition.apikey).toStrictEqual(expectedRequestAuthResult);
  });
  test('return apikey in query', () => {
    const auth: CollectionAuth = {
      forced: false,
      type: 'apikey',
      apikey: { key: 'b-key', value: 'b-value', location: ApiKeyLocation.QUERY },
    };

    const expectedRequestAuthResult = [
      { key: 'in', value: 'query', type: 'string' },
      { key: 'value', value: 'b-value', type: 'string' },
      { key: 'key', value: 'b-key', type: 'string' },
    ];

    const requestAuthDefinition = col.GetAuthDefinition(auth);
    expect(requestAuthDefinition.apikey).toBeDefined();
    expect(requestAuthDefinition.apikey).toStrictEqual(expectedRequestAuthResult);
  });
  test('throw error if apikey value, key or location is missing', () => {
    const auth: CollectionAuth = {
      forced: false,
      type: 'apikey',
    };
    try {
      col.GetAuthDefinition(auth);
    } catch (err) {
      expect(err).toStrictEqual(Error('Api key, key value or key location is missing'));
    }

    const errCases = [
      { type: 'apikey', apikey: { key: '', value: '', location: '' } },
      { type: 'apikey', apikey: { key: '', value: '' } },
      { type: 'apikey', apikey: { key: '' } },
      { type: 'apikey', apikey: {} },
      { type: 'apikey' },
      { type: 'apikey', apikey: { key: 'key-123', value: '', location: 'query' } },
      { type: 'apikey', apikey: { key: 'key-123', location: 'query' } },
      { type: 'apikey', apikey: { key: 'key-123', value: '', location: '' } },
      { type: 'apikey', apikey: { key: 'key-123', value: '' } },
      { type: 'apikey', apikey: { key: 'key-123' } },
      { type: 'apikey', apikey: { key: 'key-123', value: 'value-123', location: '' } },
      { type: 'apikey', apikey: { key: 'key-123', value: 'value-123' } },
      { type: 'apikey', apikey: { key: '', value: 'value-123', location: 'query' } },
      { type: 'apikey', apikey: { key: '', value: 'value-123', location: '' } },
      { type: 'apikey', apikey: { key: '', value: 'value-123' } },
      { type: 'apikey', apikey: { key: '', value: '', location: 'query' } },
      { type: 'apikey', apikey: { key: '', location: 'query' } },
      { type: 'apikey', apikey: { value: 'value-123', location: 'query' } },
      { type: 'apikey', apikey: { value: 'value-123', location: '' } },
      { type: 'apikey', apikey: { value: 'value-123' } },
      { type: 'apikey', apikey: { value: '', location: 'query' } },
      { type: 'apikey', apikey: { location: 'query' } },
    ];

    // eslint-disable-next-line no-restricted-syntax
    for (const errCase of errCases) {
      try {
        col.GetAuthDefinition(errCase as CollectionAuth);
      } catch (err) {
        expect(err).toStrictEqual(Error('Api key, key value or key location is missing'));
      }
    }
  });
  test('return bearer', () => {
    const auth: CollectionAuth = {
      forced: false,
      type: 'bearer',
      bearer: { token: 'token-123' },
    };

    const expectedRequestAuthResult = [
      { key: 'token', value: 'token-123', type: 'string' },
    ];

    const requestAuthDefinition = col.GetAuthDefinition(auth);
    expect(requestAuthDefinition.bearer).toBeDefined();
    expect(requestAuthDefinition.bearer).toStrictEqual(expectedRequestAuthResult);
  });
  test('throw error if bearer token value is missing', () => {
    const auth: CollectionAuth = {
      forced: false,
      type: 'bearer',
    };

    try {
      col.GetAuthDefinition(auth);
    } catch (err) {
      expect(err).toStrictEqual(Error('Bearer token is missing'));
    }

    auth.bearer = { token: '' };
    try {
      col.GetAuthDefinition(auth);
    } catch (err) {
      expect(err).toStrictEqual(Error('Bearer token is missing'));
    }
  });
  test('unsupported auth type', () => {
    const auth: CollectionAuth = {
      forced: false,
    };

    try {
      col.GetAuthDefinition(auth);
    } catch (err) {
      expect(err).toStrictEqual(Error('Unsupported auth type: undefined'));
    }

    const authObj = {
      forced: false,
      type: 'random-type',
    };
    try {
      col.GetAuthDefinition(authObj as CollectionAuth);
    } catch (err) {
      expect(err).toStrictEqual(Error('Unsupported auth type: random-type'));
    }
  });
});
