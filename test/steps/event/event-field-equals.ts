import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse, RecordDefinition, StepRecord } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/event/event-field-equals';

chai.use(sinonChai);

describe('EventFieldEqualsStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let apiClientStub: any;

  beforeEach(() => {
    // An example of how you can stub/mock API client methods.
    apiClientStub = sinon.stub();
    apiClientStub.getEvents = sinon.stub();
    stepUnderTest = new Step(apiClientStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('EventFieldEqualsStep');
    expect(stepDef.getName()).to.equal('Check a field on a Goldcast Event');
    expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_-]+) field on goldcast event (?<eventId>[a-zA-Z0-9_-]+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // eventId field
    const eventId: any = fields.filter(f => f.key === 'eventId')[0];
    expect(eventId.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(eventId.type).to.equal(FieldDefinition.Type.STRING);

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

    // Event record
    const event: any = records.filter(r => r.id === 'event')[0];
    expect(event.type).to.equal(RecordDefinition.Type.KEYVALUE);
    expect(event.mayHaveMoreFields).to.equal(true);

    // Event record ID field
    const eventId: any = event.guaranteedFieldsList.filter(f => f.key === 'id')[0];
    expect(eventId.type).to.equal(FieldDefinition.Type.STRING);

    // Event record title field
    const eventTitle: any = event.guaranteedFieldsList.filter(f => f.key === 'title')[0];
    expect(eventTitle.type).to.equal(FieldDefinition.Type.STRING);

    // Event record description field
    const eventDescription: any = event.guaranteedFieldsList.filter(f => f.key === 'description')[0];
    expect(eventDescription.type).to.equal(FieldDefinition.Type.STRING);

    // Event record type field
    const eventType: any = event.guaranteedFieldsList.filter(f => f.key === 'event_type')[0];
    expect(eventType.type).to.equal(FieldDefinition.Type.STRING);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const expectedEvent: any = {
      id: '123-abc-789-xyz', 
      someField: 'Expected Value',
      title: 'Some Title',
      description: 'description',
      event_type: 'Webinar',
    };
    apiClientStub.getEvents.returns(Promise.resolve([expectedEvent]))

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectation: 'Expected Value',
      eventId: '123-abc-789-xyz',
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    const records: StepRecord[] = response.getRecordsList();
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    expect(records[0].getId()).to.equal('event');
  });

  it('should respond with fail if API client resolves unexpected data', async () => {
    // Stub a response that does not match expectations.
    const expectedEvent: any = {
      id: '123-abc-789-xyz', 
      someField: 'Expected Value',
      title: 'Some Title',
      description: 'description',
      event_type: 'Webinar',
    };
    apiClientStub.getEvents.returns(Promise.resolve([expectedEvent]))

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectation: 'Not Expected Value',
      eventId: '123-abc-789-xyz',
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    const records: StepRecord[] = response.getRecordsList();
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    expect(records[0].getId()).to.equal('event');
  });

  it('should respond with error if API client resolves no results', async () => {
    // Stub a response with no results in the body.
    apiClientStub.getEvents.resolves({body: []});
    protoStep.setData(Struct.fromJavaScript({
      field: 'anyField',
      expectation: 'Any Value',
      email: 'anything@example.com',
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with fail if resolved user does not contain given field', async () => {
    // Stub a response with valid response, but no expected field.
    const expectedEvent: any = {
      id: '123-abc-789-xyz',
      title: 'Some Title',
      description: 'description',
      event_type: 'Webinar',
    };
    apiClientStub.getEvents.returns(Promise.resolve([expectedEvent]))

    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectation: 'Not Expected Value',
      eventId: '123-abc-789-xyz',
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    const records: StepRecord[] = response.getRecordsList();
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    expect(records[0].getId()).to.equal('event');
  });

  it('should respond with error if API client throws error', async () => {
    // Stub a response that throws any exception.
    apiClientStub.getEvents.throws();
    protoStep.setData(Struct.fromJavaScript({
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if expectation was not provided and operator is not either "be set" or "not be set"', async () => {
    protoStep.setData(Struct.fromJavaScript({
      field: 'email',
      email: 'anything@example.com',
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
