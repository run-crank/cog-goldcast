import axios from 'axios';
import * as querystring from 'query-string';
import * as grpc from 'grpc';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { EventAwareMixin } from './mixins';

class ClientWrapper {

  public static expectedAuthFields: Field[] = [{
    field: 'token',
    type: FieldDefinition.Type.STRING,
    description: 'Personal Access Token',
  }];

  public client: any;

  constructor(auth: grpc.Metadata, clientConstructor = axios) {
    this.client = clientConstructor;

    if (auth.get('token').toString()) {
      const authToken = auth.get('token').toString();

      this.client.defaults.baseURL = 'https://customapi.goldcast.io/';
      this.client.defaults.headers.common['Authorization'] = `Token ${authToken}`;
      this.client.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
      this.client.defaults.headers.get['Content-Type'] = 'application/json';
    } else {
      throw Error('Personal Access Token was not provided.');
    }
  }
}

interface ClientWrapper extends EventAwareMixin { }
applyMixins(ClientWrapper, [EventAwareMixin]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
