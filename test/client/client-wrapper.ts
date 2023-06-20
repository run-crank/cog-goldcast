import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';

chai.use(sinonChai);

describe('ClientWrapper', () => {
  const expect = chai.expect;
  let axiosStub: any;
  let metadata: Metadata;
  let clientWrapperUnderTest: ClientWrapper;

  beforeEach(() => {
    axiosStub = sinon.stub();
    axiosStub.post = sinon.stub();
    axiosStub.delete = sinon.stub();
    axiosStub.get = sinon.stub();
    axiosStub.defaults = {
      baseURL: '',
      headers: {
        common: {
          Authorization: '',
        },
        post: {
          'Content-Type': '',
        },
        get: {
          'Content-Type': '',
        }
      }
    };
  });

  it('authenticates', () => {
    // Construct grpc metadata and assert the client was authenticated.
    const expectedCallArgs = { token: 'some-api-key' };
    metadata = new Metadata();
    metadata.add('token', expectedCallArgs.token);

    // Assert that the underlying API client was authenticated correctly.
    clientWrapperUnderTest = new ClientWrapper(metadata, axiosStub);
    expect(axiosStub.defaults.headers.common['Authorization']).to.be.equal(`Token ${expectedCallArgs.token}`)
  });

});
