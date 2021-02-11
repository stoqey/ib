# Tests

We use jest and ts-jest for testing. `jest.config.js` contains the jest configuration for running the tests. The default test environment is node.

```yarn test```

There are unit tests and integration tests.

When writing tests each test should be independent of the others - it should not cause changes or have any affects on any other test.

Always clean up the data you create for the test in the `AfterAll` or `AfterEach` methods.

## Setup File

The `setup.ts` file is setup in the jest config under the key `setupFilesAfterEnv`. A number of things are done in the `setup.ts` file:

* `matchers.ts` is imported (any extensions to jest expect)


## Extending Expect

In the `matchers.ts` file I have extended the jest.expect object. Feel free to add any extentions here. They are imported in `setup.ts` so will be available to all tests. In order to get this working with typescript (to recognize the new properties) I have to include `test.d.ts` to extend the jest matchers interface.

When adding a new matcher, ensure that the first parameter of the method signature is the data that is received from expect. The interface declaration does not include this param.


**_matchers.ts_**

```toMatchSchema(data: any, schema: any)```

**_jest.d.ts_**

```toMatchSchema(schema: any)```

**_test.ts_**

```expect(data).toMatchSchema({ type: "object" })```

