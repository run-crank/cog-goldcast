import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse, RecordDefinition, StepRecord } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/event/event-member-field-equals';

chai.use(sinonChai);

describe('EventMemberFieldEqualsStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let apiClientStub: any;

  beforeEach(() => {
    // An example of how you can stub/mock API client methods.
    apiClientStub = sinon.stub();
    apiClientStub.getEventMembers = sinon.stub();
    stepUnderTest = new Step(apiClientStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('EventMemberFieldEqualsStep');
    expect(stepDef.getName()).to.equal('Check a field on a Goldcast Event Member');
    expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_-]+) field on goldcast event member (?<memberId>[a-zA-Z0-9_-]+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    

    // memberId field
    const memberId: any = fields.filter(f => f.key === 'memberId')[0];
    expect(memberId.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(memberId.type).to.equal(FieldDefinition.Type.NUMERIC);

    // Field field
    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);

    // Operator field
    const operator: any = fields.filter(f => f.key === 'operator')[0];
    expect(operator.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(operator.type).to.equal(FieldDefinition.Type.STRING);

    // Expectation field
    const expectation: any = fields.filter(f => f.key === 'expectation')[0];
    expect(expectation.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(expectation.type).to.equal(FieldDefinition.Type.ANYSCALAR);
  });

  it('should return expected step records', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const records: any[] = stepDef.getExpectedRecordsList().map((record: RecordDefinition) => {
      return record.toObject();
    });

    // Event Member record
    const eventMember: any = records.filter(r => r.id === 'member')[0];
    expect(eventMember.type).to.equal(RecordDefinition.Type.KEYVALUE);
    expect(eventMember.mayHaveMoreFields).to.equal(true);

    // Event Member record ID field
    const eventId: any = eventMember.guaranteedFieldsList.filter(f => f.key === 'id')[0];
    expect(eventId.type).to.equal(FieldDefinition.Type.NUMERIC);

    // Event Member record event field
    const event: any = eventMember.guaranteedFieldsList.filter(f => f.key === 'event')[0];
    expect(event.type).to.equal(FieldDefinition.Type.STRING);

    // Event Member user field
    const user: any = eventMember.guaranteedFieldsList.filter(f => f.key === 'user')[0];
    expect(user.type).to.equal(FieldDefinition.Type.MAP);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const expectedMember: any = {
      id: 12345, 
      event: 'Some Event',
      someField: 'Expected Value',
      user: {
        id: '123-xyz',
        name: 'Darth Vader',
      },
    };
    apiClientStub.getEventMembers.returns(Promise.resolve(expectedMember))

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectation: 'Expected Value',
      memberId: 12345,
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    const records: StepRecord[] = response.getRecordsList();
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    expect(records[0].getId()).to.equal('member');
  });

  it('should respond with fail if API client resolves unexpected data', async () => {
    // Stub a response that matches expectations.
    const expectedMember: any = {
      id: 12345, 
      event: 'Some Event',
      someField: 'Expected Value',
      user: {
        id: '123-xyz',
        name: 'Darth Vader',
      },
    };
    apiClientStub.getEventMembers.returns(Promise.resolve(expectedMember))

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectation: 'Not Expected Value',
      memberId: 12345,
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    const records: StepRecord[] = response.getRecordsList();
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    expect(records[0].getId()).to.equal('member');
  });

  it('should respond with fail if API client resolves no results', async () => {
    // Stub a response with no results in the body.
    apiClientStub.getEventMembers.returns(Promise.resolve({}))
    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectation: 'Any Value',
      memberId: 12345,
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with fail if resolved user does not contain given field', async () => {
    // Stub a response that matches expectations.
    const expectedMember: any = {
      id: 12345, 
      event: 'Some Event',
      user: {
        id: '123-xyz',
        name: 'Darth Vader',
      },
    };
    apiClientStub.getEventMembers.returns(Promise.resolve(expectedMember))

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectation: 'Expected Value',
      memberId: 12345,
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    const records: StepRecord[] = response.getRecordsList();
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    expect(records[0].getId()).to.equal('member');
  });

  it('should respond with error if API client throws error', async () => {
    // Stub a response that throws any exception.
    apiClientStub.getEventMembers.throws();
    protoStep.setData(Struct.fromJavaScript({
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if expectation was not provided and operator is not either "be set" or "not be set"', async () => {
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      memberId: 12345,
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
