import axios from 'axios';
import * as querystring from 'query-string';
import * as grpc from 'grpc';
import { Field } from '../core/base-step';
import { EventAwareMixin } from './mixins';

class ClientWrapper {

  public static expectedAuthFields: Field[] = [];

  public client: any;
  public clientReady: Promise<boolean>;

  constructor(auth: grpc.Metadata, clientConstructor = axios) {
    this.client = clientConstructor;

    try {
      // auth.set('clientId','9465beee-0d11-40d8-a1ab-72f416de7893');
      // auth.set('clientSecret','q7jomDcHvxhIBWtUTBSobUMz');
      // auth.set('refreshToken','eyJraWQiOiJvYXV0aHYyLmxtaS5jb20uMDIxOSIsImFsZyI6IlJTNTEyIn0.eyJzYyI6ImNvbGxhYjoiLCJzdWIiOiIxNzU1Njg4NDk3MTExNDA5OTg5IiwiYXVkIjoiOTQ2NWJlZWUtMGQxMS00MGQ4LWExYWItNzJmNDE2ZGU3ODkzIiwib2duIjoicHdkIiwidHlwIjoiciIsImV4cCI6MTY2MDk2MzcyMSwiaWF0IjoxNjU4MzcxNzIxLCJqdGkiOiJkNGQxNmE3ZS03ZmU3LTRhZWQtYTIxYS03NjQwZGNhODIzYzQifQ.GI1LtrhTyb9INOdMTfQWwqGOmK9VVOkQU8bk9EKZLqRXQj06GNm-Oo-PQIMu12zexXceWs-jTz0Bs2tc_GzaDmmQ27hVZivDiH2ZePbhKQgabzGjWhn-IMq0PNjNwCprLp_kTV9ScN46Uhq77YWtPFrc2UNBWLGhRMP960wwUaQMO4Oq4qzlDYpVKGhpLx-ybzJPCV4u3Zofz4PVxyWgk1hoHxaCn2DhwaqSGzmW8JcG071IERyNfHsOauhiCwSIrxZU795bUFew9zcLHIDPqbnSGgIHCJybhOIgxT3jwEaojchpm6c5WL7npQ21zVylEXOnELiXa5JVP9B8fevb7Q');
      if (auth.get('refreshToken').toString() && auth.get('clientId').toString() && auth.get('clientSecret').toString()) {
        this.clientReady = new Promise(async (resolve, reject) => {
          try {
            const authToken = Buffer.from(`${auth.get('clientId').toString()}:${auth.get('clientSecret').toString()}`).toString('base64');

            const tokenResponse = await this.client.post('https://customapi.goldcast.io/oauth/token', querystring.stringify({
              'grant_type': 'refresh_token',
              'refresh_token': auth.get('refreshToken').toString(),
            }), {
              headers: {
                'Authorization': `Basic ${authToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            });

            if (tokenResponse.data['access_token']) {
              this.client.defaults.baseURL = 'https://customapi.goldcast.io/';
              this.client.defaults.headers.common['Authorization'] = `Bearer ${tokenResponse.data['access_token']}`;
              this.client.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
              this.client.defaults.headers.get['Content-Type'] = 'application/json';

              resolve(true);
            } else {
              reject('Access Token was not retrieved. Please try to reconnect.');
            }
          } catch (e) {
            reject(e.response.data);
          }
        });
      } else {
        this.clientReady = Promise.reject('Refresh Token was not provided. Try reconnecting to you goldcast instance.');
      }
    } catch (e) {
      throw e;
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