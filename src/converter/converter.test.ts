import { Collection, Item, ItemGroup } from 'postman-collection';

import { Converter } from './converter';
import { IOptions, CollectionSet } from './converter.model';
import { petStoreOpenAPI } from './pet-store.openapi.mock';

const setsConfig = {
  sets: [
    {
      collectionName: 'pc-sets-store-example',
      scriptsPath: 'examples/scripts',
      template: {
        preRequestTemplateFilePath: 'examples/scripts/template/pre-request.template',
      },
      order: [
        { method: 'post', path: 'store/order' },
        { method: 'get', path: 'store/order/:orderId' },
        { method: 'get', path: 'store/inventory' },
      ],
    },
    {
      collectionName: 'pc-sets-pet-example',
      scriptsPath: 'examples/scripts',
      order: [
        { method: 'get', path: 'pet/findByStatus' },
        { method: 'put', path: 'pet' },
        { method: 'get', path: 'pet/findByTags' },
        { method: 'delete', path: 'pet/:petId' },
        { method: 'post', path: 'pet' },
      ],
    },
    {
      collectionName: 'pc-sets-pet-example-scripts',
      scriptsPath: 'examples/scripts',
      template: {},
      order: [
        { method: 'get', path: 'pet/findByStatus' },
        { method: 'put', path: 'pet' },
        { method: 'get', path: 'pet/findByTags' },
        { method: 'delete', path: 'pet/:petId' },
        { method: 'post', path: 'pet' },
      ],
    },
    {
      collectionName: 'pc-sets-pet-example-scripts-II',
      scriptsPath: 'examples/scripts',
      template: {
        preRequestTemplateFilePath: '',
      },
      order: [
        { method: 'get', path: 'pet/findByStatus' },
        { method: 'put', path: 'pet' },
        { method: 'get', path: 'pet/findByTags' },
        { method: 'delete', path: 'pet/:petId' },
        { method: 'post', path: 'pet' },
      ],
    },
    {
      collectionName: 'pc-sets-pet-example-with-auth',
      template: {
        something: '',
      },
      auth: {
        type: 'basic',
        basic: { username: 'user', password: 'pass' },
      },
      order: [
        { method: 'get', path: 'pet/findByStatus' },
        { method: 'put', path: 'pet' },
        { method: 'get', path: 'pet/findByTags' },
        { method: 'delete', path: 'pet/:petId' },
        { method: 'post', path: 'pet' },
      ],
    },
  ],
};
const setsBadConfig = {
  sets: [
    {
      collectionName: 'pc-sets-pet-example-with-auth',
      template: {
        something: '',
      },
      auth: {
        type: 'basic',
        basic: { password: 'pass' },
      },
      order: [
        { method: 'get', path: 'pet/findByStatus' },
        { method: 'put', path: 'pet' },
        { method: 'get', path: 'pet/findByTags' },
        { method: 'delete', path: 'pet/:petId' },
        { method: 'post', path: 'pet' },
      ],
    },
    {
      collectionName: 'pc-sets-pet-example-with-bad-auth',
      template: {
        something: '',
      },
      auth: {
        type: 'bearer',
        basic: { password: 'pass' },
      },
      order: [
        { method: 'get', path: 'pet/findByStatus' },
        { method: 'put', path: 'pet' },
        { method: 'get', path: 'pet/findByTags' },
        { method: 'delete', path: 'pet/:petId' },
        { method: 'post', path: 'pet' },
      ],
    },
  ],
};

describe('Convert', () => {
  test('Convert - Check endpoint list', async () => {
    const converterOptions: Partial<IOptions> = { openApiDocContent: JSON.stringify(petStoreOpenAPI) };
    const converter: Converter = new Converter(converterOptions as IOptions);
    const expectedEndpoints: Array<string> = [
      'Add a new pet to the store',
      'Update an existing pet',
      'Finds Pets by status',
      'Finds Pets by tags',
      'Find pet by ID',
      'Updates a pet in the store with form data',
      'Deletes a pet',
      'uploads an image',
      'Returns pet inventories by status',
      'Place an order for a pet',
      'Find purchase order by ID',
      'Delete purchase order by ID',
      'Create user',
      'Creates list of users with given input array',
      'Creates list of users with given input array',
      'Logs user into the system',
      'Logs out current logged in user session',
      'Get user by user name',
      'Updated user',
      'Delete user',
    ];

    await converter.Convert().then((col: Collection) => {
      expect(col.items.count()).toBe(3);
      expect(col.items.idx(0).name).toBe('pet');
      expect(col.items.idx(1).name).toBe('store');
      expect(col.items.idx(2).name).toBe('user');
      const result: Array<string> = [];
      col.forEachItem((i: Item) => {
        result.push(i.name);
      });
      expect(result).toStrictEqual(expectedEndpoints);
    });
  });

  test('Convert - Check endpoints body', async () => {
    const converterOptions: Partial<IOptions> = { openApiDocContent: JSON.stringify(petStoreOpenAPI) };
    const converter: Converter = new Converter(converterOptions as IOptions);
    const expectedUserBody = {
      id: '{{id}}',
      username: '{{username}}',
      firstName: '{{firstName}}',
      lastName: '{{lastName}}',
      email: '{{email}}',
      password: '{{password}}',
      phone: '{{phone}}',
      userStatus: '{{userStatus}}',
    };

    const expectedPetBody = {
      complete: '{{complete}}',
      id: '{{id}}',
      petId: '{{petId}}',
      quantity: '{{quantity}}',
      shipDate: '{{shipDate}}',
      status: '{{status}}',
    };

    const expectedStoreBody = {
      category: {
        id: '{{categoryId}}',
        name: '{{categoryName}}',
      },
      id: '{{id}}',
      name: '{{name}}',
      photoUrls: [
        '{{photoUrls0}}',
        '{{photoUrls1}}',
      ],
      status: '{{status}}',
      tags: [
        {
          id: '{{tags0Id}}',
          name: '{{tags0Name}}',
        },
        {
          id: '{{tags1Id}}',
          name: '{{tags1Name}}',
        },
      ],
    };

    await converter.Convert().then((col: Collection) => {
      const createUserBody = col.oneDeep('Create user').request.body?.raw;
      const placeOrderForPet = col.oneDeep('Place an order for a pet').request.body?.raw;
      const newPetToStore = col.oneDeep('Add a new pet to the store').request.body?.raw;

      expect(createUserBody).toBeDefined();
      expect(placeOrderForPet).toBeDefined();
      expect(newPetToStore).toBeDefined();

      expect(JSON.parse(createUserBody as string)).toStrictEqual(expectedUserBody);
      expect(JSON.parse(placeOrderForPet as string)).toStrictEqual(expectedPetBody);
      expect(JSON.parse(newPetToStore as string)).toStrictEqual(expectedStoreBody);
    });
  });
  test('incorrect open api doc', async () => {
    const convertingOptions: Partial<IOptions> = { openApiDocContent: JSON.stringify({ key: 'undefined' }) };
    const converter: Converter = new Converter(convertingOptions as IOptions);
    expect.assertions(1);
    expect(converter.Convert()).rejects.toEqual('Specification must contain a semantic version number of the OAS specification');
  });
});

describe('Create sets', () => {
  test('successfully create a set', async () => {
    const converterOptions: Partial<IOptions> = { openApiDocContent: JSON.stringify(petStoreOpenAPI), setsConfig: JSON.parse(JSON.stringify(setsConfig)) };
    const converter: Converter = new Converter(converterOptions as IOptions);
    type methodPath = {
      method: string
      path: string
    }
    const expected0SetItemNames: Array<methodPath> = [
      { method: 'POST', path: 'store/order' },
      { method: 'GET', path: 'store/order/:orderId' },
      { method: 'GET', path: 'store/inventory' },
    ];
    const expected1SetItemNames: Array<methodPath> = [
      { method: 'GET', path: 'pet/findByStatus' },
      { method: 'PUT', path: 'pet' },
      { method: 'GET', path: 'pet/findByTags' },
      { method: 'DELETE', path: 'pet/:petId' },
      { method: 'POST', path: 'pet' },
    ];
    await converter.CreateSets().then((sets: CollectionSet[]) => {
      expect(sets.length).toBe(5);
      expect(sets[0].name).toBe('pc-sets-store-example');
      expect(sets[1].name).toBe('pc-sets-pet-example');
      expect(sets[2].name).toBe('pc-sets-pet-example-scripts');
      expect(sets[3].name).toBe('pc-sets-pet-example-scripts-II');
      expect(sets[4].name).toBe('pc-sets-pet-example-with-auth');
      expect(sets[0].collection.items.count()).toBe(3);

      let array: Array<methodPath> = [];
      sets[0].collection.items.each((item: Item | ItemGroup<Item>) => {
        const path = (item as Item).request.url.path as string[];
        expect(path).toBeDefined();
        array.push({ method: (item as Item).request.method, path: path.join('/') });
      });
      expect(array).toStrictEqual(expected0SetItemNames);

      expect(sets[1].collection.items.count()).toBe(5);
      array = [];
      sets[1].collection.items.each((item: Item | ItemGroup<Item>) => {
        const path = (item as Item).request.url.path as string[];
        expect(path).toBeDefined();
        array.push({ method: (item as Item).request.method, path: path.join('/') });
      });
      expect(array).toStrictEqual(expected1SetItemNames);

      expect(sets[0].collection.items.idx(0).events.count()).toBe(2);

      expect(sets[0].collection.items.idx(0).events.idx(0).script.exec?.toString())
        .toBe('var requestBody = {,  "id": "{{id}}",,  "petId": "{{petId}}",,  '
          + '"quantity": "{{quantity}}",,  "shipDate": "{{shipDate}}",,  "status": "{{status}}",'
          + ',  "complete": "{{complete}}",};,,// post-storeorder.js,const quantity = 100;'
          + ',pm.environment.set(\'quantity\', quantity);,,,pm.environment.set(\'requestBody\', JSON.stringify(requestBody));');

      expect(sets[0].collection.items.idx(0).events.idx(1).script.exec?.toString())
        // eslint-disable-next-line max-len
        .toBe('// post-storeorder.js,pm.test(\'Status code is 200\', () => {,  pm.response.to.have.status(200);,});,,pm.test(\'Test status == 100\', () => {,  const jsonData = pm.response.json();,  pm.expect(jsonData.quantity).to.eql(pm.environment.get(\'quantity\'));,});,');
    });
  });
  test('incorrect open api', async () => {
    const converterOptions: Partial<IOptions> = { openApiDocContent: JSON.stringify('petStoreOpenAPI'), setsConfig: JSON.parse(JSON.stringify(setsConfig)) };
    const converter: Converter = new Converter(converterOptions as IOptions);

    await expect(converter.CreateSets()).rejects.toBe('Specification must contain a semantic version number of the OAS specification');
  });
  test('incorrect sets config', async () => {
    const converterOptions: Partial<IOptions> = {
      openApiDocContent: JSON.stringify(petStoreOpenAPI),
      setsConfig: JSON.parse(JSON.stringify({ incorrect: 'config' })),
    };
    const converter: Converter = new Converter(converterOptions as IOptions);

    await expect(converter.CreateSets()).rejects.toStrictEqual(Error('Sets config is undefined or is incorrect'));
  });
  test('sets config is missing', async () => {
    const converterOptions: Partial<IOptions> = { openApiDocContent: JSON.stringify(petStoreOpenAPI) };
    const converter: Converter = new Converter(converterOptions as IOptions);

    await expect(converter.CreateSets()).rejects.toStrictEqual(Error('Sets config is undefined or is incorrect'));
  });

  test('incorrect auth settings in set', async () => {
    const converterOptions: Partial<IOptions> = { openApiDocContent: JSON.stringify(petStoreOpenAPI), setsConfig: JSON.parse(JSON.stringify(setsBadConfig)) };
    const converter: Converter = new Converter(converterOptions as IOptions);

    await expect(converter.CreateSets()).rejects.toStrictEqual(Error('Username or password is missing'));
  });
});
