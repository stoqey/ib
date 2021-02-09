declare namespace jest {
  interface Matchers<R> {
    toMatchSchema(schema: any): R;
  }
}
