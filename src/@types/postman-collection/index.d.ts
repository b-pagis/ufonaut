import { RequestAuthDefinition } from 'postman-collection';
import {
  OrderList, EndpointInfo, PreRequestTestScript, CollectionAuth,
} from '../../converter/converter.model';

declare module 'postman-collection' {
  export interface Collection {
    Rename(name: string): void;
    AddScripts(scripts: PreRequestTestScript[], template?: string): void;
    Order(orderList: OrderList, discardNotInOrderList: boolean): void;
    NormalizedEndpointNameFn(method: string, path: string): string;
    ListEndpoints(): EndpointInfo[];
    SetAuthorization(auth: RequestAuthDefinition, forceAuth: boolean): void;
    GetAuthDefinition(auth: CollectionAuth): RequestAuthDefinition;
  }
}
