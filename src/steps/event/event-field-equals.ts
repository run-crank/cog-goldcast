/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';

export class EventFieldEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Goldcast Event';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_-]+) field on goldcast event (?<eventId>[a-zA-Z0-9_-]+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Event';
  protected expectedFields: Field[] = [{
    field: 'eventId',
    type: FieldDefinition.Type.STRING,
    description: 'Event ID',
    optionality: FieldDefinition.Optionality.REQUIRED,
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
    optionality: FieldDefinition.Optionality.REQUIRED,
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, not be one of, match, or not match)',
  }, {
    field: 'expectation',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Expected field value',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'event',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.STRING,
      description: 'Event ID',
    }, {
      field: 'title',
      type: FieldDefinition.Type.STRING,
      description: 'Title',
    }, {
      field: 'description',
      type: FieldDefinition.Type.STRING,
      description: 'Description',
    }, {
      field: 'event_type',
      type: FieldDefinition.Type.STRING,
      description: 'Event Type',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectedValue = stepData.expectation;
    const eventId = stepData.eventId;
    const operator: string = stepData.operator || 'be';
    const field = stepData.field;

    if ((expectedValue === null || expectedValue === undefined) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      const data: any = await this.client.getEvents();

      const matchingRecords = data.filter((d: any) => d.id === eventId);
      if (!matchingRecords || !matchingRecords.length) {
        return this.fail("Couldn't find a event with id %s", [
          eventId,
        ]);
      }

      if (matchingRecords.length > 1) {
        return this.fail('Found more than one record with id %s', [
          eventId,
        ]);
      }

      const event = matchingRecords[0];
      const records = this.createRecords(event, stepData['__stepOrder']);

      if (event && event.hasOwnProperty(field)) {
        const result = this.assert(operator, event[field], expectedValue, field, stepData['__piiSuppressionLevel']);
        return result.valid ? this.pass(result.message, [], records)
          : this.fail(result.message, [], records);

      } else {
        if (event && !event.hasOwnProperty(field)) {
          return this.fail(
            'Found the event with id %s, but there was no %s field.',
            [eventId, field],
            records,
          );
        } else {
          return this.fail("Couldn't find a event with id %s", [
            eventId,
          ]);
        }
      }
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      if (e.response && e.response.status === 404) {
        return this.error(`${JSON.parse(e.response.data).description}: %s`, [JSON.stringify({ eventId })]);
      }

      return this.error('There was an error while validating this event field: %s', [e.message]);
    }
  }

  createRecords(event: Record<string, any>, stepOrder = 1) {
    const records = [];
    // Base Record
    records.push(this.keyValue('event', 'Checked Event', event));
    // Ordered Record
    records.push(this.keyValue(`event.${stepOrder}`, `Checked Event from Step ${stepOrder}`, event));
    return records;
  }
}

export { EventFieldEqualsStep as Step };
