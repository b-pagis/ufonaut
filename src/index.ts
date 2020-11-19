/* eslint-disable max-len */
import { Command, ExecutableCommandOptions } from 'commander';

import Cli from './cli';
import { ExecuteConvertWrite, ExecuteListEndpoints, ExecuteCreateWriteSets } from './executor/executor';
import { IOptions } from './executor/executor.model';

const commandOptions: ExecutableCommandOptions = {
  isDefault: true,
};

const version = '1.0.0';

const program = new Command();
program.version(version);

program
  .command('cli', commandOptions)
  .description('Launch interactive CLI')
  .action(async () => {
    await Cli.run();
  });

program
  .command('convert')
  .description('Convert remote openAPIv3 document to postman collection.')
  .requiredOption('-i, --input <open-api-file-location>', 'Local path or remote URL to open api JSON file.')
  .requiredOption('-o, --output <postman-collection>', 'File path where postman collection will be saved.')
  .option('-d, --order [order-config-path]', 'Path to order config JSON file.')
  .option('-s, --scripts [scripts-path]', 'Path to catalog containing test and pre-request catalogs with corresponding script files.')
  .option('-u, --username <username>', 'In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth username.')
  .option('-p, --password <password>', 'In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth password.')
  .option('-x, --x-api-key <api-key>', 'In case open api file is accessed by URL that is protected with X-API-KEY header, this option is used to provide X-API-KEY header value.')
  .option('-b, --bearer-token <token>', 'In case open api file is accessed by URL that is protected with Bearer token, this option is used to provide Authorization: Bearer header value.')
  .option('-cr, --rename <name>', 'Postman collection\'s name.')
  .option('-ca, --collection-auth-type <type>', 'Postman Collection\'s auth type [basic, apikey, bearer]. Will only affect those endpoints that are using some kinds of authentication option.')
  .option('-cu, --collection-basic-auth-username <username>', 'Postman Collection\'s basic auth username.')
  .option('-cp, --collection-basic-auth-password <password>', 'Postman Collection\'s basic auth password.')
  .option('-ck, --collection-api-key-auth-key <apiKey>', 'Postman Collection\'s api key auth key(default: "X-API-KEY").')
  .option('-cv, --collection-api-key-auth-value <apiKey-value>', 'Postman Collection\'s api key auth key value.')
  .option('-cl, --collection-api-key-auth-location <location-type>', 'Postman Collection\'s api key auth location [header, query]', 'header')
  .option('-cb, --collection-bearer-auth-token <token>', 'Postman Collection\'s bearer auth token value.')
  .option('-cf, --collection-forced-auth', 'Force to use specified auth type for all Postman Collection\'s endpoints ', false)
  .option('-t, --script-template <scriptTemplateLocation>', 'Path to scripts template catalog')
  .action((options) => {
    const executorOptions: IOptions = {
      inputFileLocation: options.input,
      outputPath: options.output,
      scriptsCatalogLocation: options.scripts,
      orderConfigFileLocation: options.order,
      collectionName: options.name,
      authHeaderBasicAuthUsername: options.username,
      authHeaderBasicAuthPassword: options.password,
      authHeaderXApiKey: options.xApiKey,
      authHeaderBearerToken: options.bearerToken,
      collectionAuthType: options.collectionAuthType,
      collectionBasicAuthUsername: options.collectionBasicAuthUsername,
      collectionBasicAuthPassword: options.collectionBasicAuthPassword,
      collectionApiKeyAuthKey: options.collectionApiKeyAuthKey,
      collectionApiKeyAuthValue: options.collectionApiKeyAutValue,
      collectionApiKeyAuthLocation: options.collectionApiKeyAuthLocation,
      collectionBearerAuthToken: options.collectionBearerAuthToken,
      collectionForcedAuth: options.collectionForcedAuth,
      collectionPreRequestScriptTemplateLocation: options.scriptTemplateLocation,
    };
    ExecuteConvertWrite(executorOptions);
  });

program
  .command('create-sets')
  .description('Create sets of postman collections from openAPIv3 document based on sets config.')
  .requiredOption('-i, --input <open-api-file-location>', 'Local path or remote URL to open api JSON file.')
  .requiredOption('-c, --sets-config <sets-config>', 'Path to sets config JSON file.')
  .requiredOption('-o, --output <out-sets>', 'Path where to output sets collections.')
  .option('-u, --username <username>', 'In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth username.')
  .option('-p, --password <password>', 'In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth password.')
  .option('-x, --x-api-key <api-key>', 'In case open api file is accessed by URL that is protected with X-API-KEY header, this option is used to provide X-API-KEY header value.')
  .option('-b, --bearer-token <token>', 'In case open api file is accessed by URL that is protected with Bearer token, this option is used to provide Authorization: Bearer header value.')
  .action((options) => {
    const executorOptions: IOptions = {
      inputFileLocation: options.input,
      outputPath: options.output,
      setsConfigFileLocation: options.setsConfig,
      authHeaderBasicAuthUsername: options.username,
      authHeaderBasicAuthPassword: options.password,
      authHeaderXApiKey: options.xApiKey,
      authHeaderBearerToken: options.bearerToken,
    };
    ExecuteCreateWriteSets(executorOptions);
  });

program
  .command('endpoints')
  .description('List all endpoints in postman collection')
  .requiredOption('-i, --input <open-api-file-location>', 'Local path or remote URL to open api JSON file.')
  .option('-n, --normalized', 'In addition, outputs normalized endpoint path that could be used for script files.')
  .option('-t, --output-type <output-type>', 'Output file type [md, csv]. By default prints to console.')
  .option('-o, --output <output>', 'Output file location.')
  .option('-u, --username <username>', 'In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth username.')
  .option('-p, --password <password>', 'In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth password.')
  .option('-x, --x-api-key <api-key>', 'In case open api file is accessed by URL that is protected with X-API-KEY header, this option is used to provide X-API-KEY header value.')
  .option('-b, --bearer-token <token>', 'In case open api file is accessed by URL that is protected with Bearer token, this option is used to provide Authorization: Bearer header value.')
  .action((options) => {
    const executorOptions: IOptions = {
      inputFileLocation: options.input,
      outputPath: options.output,
      outputFileType: options.outputType,
      displayNormalized: options.normalized,
      authHeaderBasicAuthUsername: options.username,
      authHeaderBasicAuthPassword: options.password,
      authHeaderXApiKey: options.xApiKey,
      authHeaderBearerToken: options.bearerToken,
    };
    ExecuteListEndpoints(executorOptions);
  });

program.parse(process.argv);
