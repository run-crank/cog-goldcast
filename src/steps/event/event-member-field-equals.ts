/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';

export class EventMemberFieldEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Goldcast Event Member';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_-]+) field on goldcast event member (?<memberId>[a-zA-Z0-9_-]+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Event Member';
  protected expectedFields: Field[] = [{
    field: 'memberId',
    type: FieldDefinition.Type.NUMERIC,
    description: 'Member Id',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
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
    id: 'member',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Member's ID",
    }, {
      field: 'event',
      type: FieldDefinition.Type.STRING,
      description: 'Event ID',
    }, {
      field: 'user',
      type: FieldDefinition.Type.MAP,
      description: 'User',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectedValue = stepData.expectation;
    const memberId = stepData.memberId;
    const operator: string = stepData.operator;
    const field = stepData.field;

    if ((expectedValue === null || expectedValue === undefined) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      const data: any = await this.client.getEventMembers(memberId);
      const records = this.createRecords(data, stepData['__stepOrder']);

      if (data && data.hasOwnProperty(field)) {
        const result = this.assert(operator, data[field], expectedValue, field, stepData['__piiSuppressionLevel']);
        return result.valid ? this.pass(result.message, [], records)
          : this.fail(result.message, [], records);

      } else {
        if (data && !data.hasOwnProperty(field)) {
          return this.fail(
            'Found the member with event id %s, but there was no %s field.',
            [memberId, field],
            records,
          );
        } else {
          return this.fail("Couldn't find a member associated with event id %s", [
            memberId,
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
        return this.error(`${JSON.parse(e.response.data).description}: %s`, [JSON.stringify({ memberId })]);
      }

      return this.error('There was an error during validation of member field: %s', [e.message]);
    }
  }

  createRecords(member: Record<string, any>, stepOrder = 1) {
    const records = [];
    // Base Record
    records.push(this.keyValue('member', 'Checked Member', member));
    // Ordered Record
    records.push(this.keyValue(`member.${stepOrder}`, `Checked Event Member from Step ${stepOrder}`, member));
    return records;
  }
}

export { EventMemberFieldEqualsStep as Step };
