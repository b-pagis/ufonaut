/* eslint-disable @typescript-eslint/no-explicit-any */
// For some reason when openapi-to-postmanv2 is mocked all other test fails with timeout
// beforeEach and describe blocks does not help, neither jest.doMock / jest.dontMock.
// Should investigate further in free time.
// For now it seems that if moved to separate file if does not affect other tests

import * as postmanConverter from 'openapi-to-postmanv2';
import { Converter } from './converter';
import { IOptions } from './converter.model';

// Might be related to https://github.com/facebook/jest/issues/6914
jest.mock('openapi-to-postmanv2');
test('Convert - postman converter error', async () => {
  const converterOptions: Partial<IOptions> = { openApiDocContent: '' };
  const converter: Converter = new Converter(converterOptions as IOptions);
  const pcm = jest.spyOn(postmanConverter, 'convert').mockImplementationOnce((a: any, b: any, cb: any) => cb(new Error('failure')));

  await converter.Convert().catch((err: Error) => {
    expect(err).toStrictEqual(Error('failure'));
  });

  pcm.mockReset();
});

test('Convert - more than one result', async () => {
  const converterOptions: Partial<IOptions> = { openApiDocContent: '' };
  const converter: Converter = new Converter(converterOptions as IOptions);
  const result = {
    result: true,
    output: [
      'item1',
      'item2',
    ],
  };
  const pcm = jest.spyOn(postmanConverter, 'convert').mockImplementationOnce((a: any, b: any, cb: any) => cb(null, result));

  await converter.Convert().catch((err: Error) => {
    expect(err).toStrictEqual(Error('Error while getting results. Conversion output array is not equal to 1'));
  });

  pcm.mockReset();
});
