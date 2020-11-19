import { prompt } from 'inquirer';
import { ShowTitleAndBanner, ShowError } from './utils/logger.util';
import {
  ActionQuestion,
  FilePathQuestion,
  ConfirmationQuestion,
  AuthorizationHeaderTypeQuestion,
  AuthorizationHeaderQuestion,
  AdditionalConvertingActionsQuestion,
  InputFieldQuestion,
  AuthorizationApiKeyQuestion,
  AuthorizationApiKeyLocation,
  OutputFileTypeQuestion,
} from './questions/questions';
import {
  ActionAnswer,
  KEY_ACTION,
  Action,
  KEY_INPUT,
  KEY_CONFIRMED,
  KEY_AUTH_TYPE,
  KEY_AUTH_BASIC_USERNAME,
  KEY_AUTH_BASIC_PASSWORD,
  KEY_AUTH_API_KEY_VALUE,
  KEY_ADDITIONAL_ACTIONS,
  ConvertActions,
  KEY_AUTH_BEARER_TOKEN,
  KEY_AUTH_API_KEY,
  KEY_AUTH_API_KEY_LOCATION,
  KEY_FILE_TYPE,
  FileType,
} from './models/answer';
import { IsURL } from './utils/http.util';
import { ExecuteConvertWrite, ExecuteCreateWriteSets, ExecuteListEndpoints } from './executor/executor';
import { IOptions } from './executor/executor.model';

class Cli {
  private actionAnswer: ActionAnswer | undefined;

  private executorOptions: IOptions = { inputFileLocation: '' };

  public async run(): Promise<void> {
    ShowTitleAndBanner();
    try {
      this.actionAnswer = await prompt(ActionQuestion);

      switch (this.actionAnswer[KEY_ACTION]) {
        case Action.CONVERT:
          await this.convertActionQuestions();
          this.convert();
          break;
        case Action.CREATE_SETS:
          await this.setsActionQuestions();
          this.createSets();
          break;
        case Action.LIST_ENDPOINTS:
          await this.listEndpointsQuestions();
          this.listEndpoints();
          break;
        default:
          break;
      }
    } catch (err) {
      ShowError(err.stack);
    }
  }

  private async convertActionQuestions(): Promise<void> {
    await this.openApiDocContentQuestions();

    this.executorOptions.outputPath = (await prompt(FilePathQuestion('output path:', 'postman-collection.json')))[KEY_INPUT];

    const additionConvertingActionsAnswer = await prompt(AdditionalConvertingActionsQuestion);

    if (additionConvertingActionsAnswer[KEY_ADDITIONAL_ACTIONS].includes(ConvertActions.RENAME_COLLECTION)) {
      this.executorOptions.collectionName = (await prompt(InputFieldQuestion('enter collection name')))[KEY_INPUT];
    }

    if (additionConvertingActionsAnswer[KEY_ADDITIONAL_ACTIONS].includes(ConvertActions.APPLY_SCRIPTS)) {
      this.executorOptions.scriptsCatalogLocation = (await prompt(FilePathQuestion('please specify path to scripts', undefined, true)))[KEY_INPUT];
      const preRequestTemplateUsageAnswer = (await prompt(ConfirmationQuestion('use pre-request template?', false)))[KEY_CONFIRMED];
      if (preRequestTemplateUsageAnswer) {
        this.executorOptions.collectionPreRequestScriptTemplateLocation = (
          await prompt(FilePathQuestion('please specify pre-request script template location', undefined, true))
        )[KEY_INPUT];
      }
    }

    if (additionConvertingActionsAnswer[KEY_ADDITIONAL_ACTIONS].includes(ConvertActions.ORDER_COLLECTION)) {
      this.executorOptions.orderConfigFileLocation = (await prompt(FilePathQuestion('please specify path to order config', undefined, true)))[KEY_INPUT];
    }

    if (additionConvertingActionsAnswer[KEY_ADDITIONAL_ACTIONS].includes(ConvertActions.CHANGE_ENDPOINTS_AUTH)) {
      const collectionAuthorizationHeaderTypeAnswer = (await prompt(AuthorizationHeaderTypeQuestion));
      const collectionAuthorizationHeaderAnswer = (await prompt(AuthorizationHeaderQuestion(collectionAuthorizationHeaderTypeAnswer[KEY_AUTH_TYPE])));
      this.executorOptions.collectionAuthType = collectionAuthorizationHeaderTypeAnswer[KEY_AUTH_TYPE];

      this.executorOptions.collectionBasicAuthPassword = collectionAuthorizationHeaderAnswer[KEY_AUTH_BASIC_PASSWORD];
      this.executorOptions.collectionBasicAuthUsername = collectionAuthorizationHeaderAnswer[KEY_AUTH_BASIC_USERNAME];
      this.executorOptions.collectionApiKeyAuthValue = collectionAuthorizationHeaderAnswer[KEY_AUTH_API_KEY_VALUE];
      this.executorOptions.collectionBearerAuthToken = collectionAuthorizationHeaderAnswer[KEY_AUTH_BEARER_TOKEN];
      if (collectionAuthorizationHeaderAnswer[KEY_AUTH_API_KEY_VALUE]) {
        this.executorOptions.collectionApiKeyAuthKey = (await prompt(AuthorizationApiKeyQuestion))[KEY_AUTH_API_KEY];
        this.executorOptions.collectionApiKeyAuthLocation = (await prompt(AuthorizationApiKeyLocation))[KEY_AUTH_API_KEY_LOCATION];
      }
      this.executorOptions.collectionForcedAuth = (await prompt(ConfirmationQuestion('force auth for all endpoints', true)))[KEY_CONFIRMED];
    }
  }

  private async setsActionQuestions(): Promise<void> {
    await this.openApiDocContentQuestions();
    this.executorOptions.setsConfigFileLocation = (await prompt(FilePathQuestion('please specify path to sets config', undefined, true)))[KEY_INPUT];
    this.executorOptions.outputPath = (await prompt(FilePathQuestion('please specify path where to save sets', undefined, true)))[KEY_INPUT];
  }

  private async openApiDocContentQuestions(): Promise<void> {
    this.executorOptions.inputFileLocation = (await prompt(FilePathQuestion('path or URL to openapi file:', 'openapi.json')))[KEY_INPUT];
    if (!IsURL(this.executorOptions.inputFileLocation)) {
      return;
    }

    const authorizationHeaderUsageAnswer = await prompt(ConfirmationQuestion('use authorization headers?'));
    if (authorizationHeaderUsageAnswer[KEY_CONFIRMED]) {
      const authorizationHeaderTypeAnswer = await prompt(AuthorizationHeaderTypeQuestion);
      const authorizationHeaderValuesAnswer = (await prompt(AuthorizationHeaderQuestion(authorizationHeaderTypeAnswer[KEY_AUTH_TYPE])));
      this.executorOptions.authHeaderBasicAuthUsername = authorizationHeaderValuesAnswer[KEY_AUTH_BASIC_USERNAME];
      this.executorOptions.authHeaderBasicAuthPassword = authorizationHeaderValuesAnswer[KEY_AUTH_BASIC_PASSWORD];
      this.executorOptions.authHeaderXApiKey = authorizationHeaderValuesAnswer[KEY_AUTH_API_KEY_VALUE];
      this.executorOptions.authHeaderBearerToken = authorizationHeaderValuesAnswer[KEY_AUTH_BEARER_TOKEN];
    }
  }

  private async listEndpointsQuestions(): Promise<void> {
    await this.openApiDocContentQuestions();
    this.executorOptions.outputFileType = (await prompt(OutputFileTypeQuestion))[KEY_FILE_TYPE];
    if (this.executorOptions.outputFileType !== FileType.NONE) {
      this.executorOptions.outputPath = (
        await prompt(FilePathQuestion('output file path', `endpoints-list.${this.executorOptions.outputFileType}`))
      )[KEY_INPUT];
    }
    this.executorOptions.displayNormalized = (await prompt(ConfirmationQuestion('display normalized endpoints?', true)))[KEY_CONFIRMED];
  }

  private async createSets(): Promise<void> {
    ExecuteCreateWriteSets(this.executorOptions);
  }

  private async convert(): Promise<void> {
    ExecuteConvertWrite(this.executorOptions);
  }

  private async listEndpoints(): Promise<void> {
    ExecuteListEndpoints(this.executorOptions);
  }
}

export default new Cli();
