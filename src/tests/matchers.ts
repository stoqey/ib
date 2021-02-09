/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from "ajv";

const ajv = new Ajv();

expect.extend({
  toMatchSchema(data: any, schema: any): jest.CustomMatcherResult {
    const pass = ajv.validate(schema, data);
    if (pass) {
      return {
        message: () => "expected to not match schema",
        pass: true,
      };
    }
    return {
      message: () => {
        const errors = JSON.stringify(ajv.errors, null, 2);
        return `expected to match schema, instead ${errors}`;
      },
      pass: false,
    };
  },
});
