# Config

We can have environment specific json files in here. They must have the exact name as the environment.

**This is for storing non-secret configuration only. We should still be using environment variables to store secret configs.**

Although we use environment variables to store secrets, we still use the config object in our code for all config variables (see below for explanation).

The `default.json` file stores configuration common to all environments, and null keys so that we know what configs we have available to us.
`local.json` is a file stored on our local machines only (it's in .gitignore). You can use this to store any local configs, secret or not. You can also instead use the `.env` file.

`configuration.ts` uses these files to compile a config object for use in the app. It follows the following rules:

1. `default.json` is read and the config object is created from those variables
2. `local.json` is read and laid over the top
3. the environment specific json file is read and laid over the top (e.g. staging.json)
4. process.env vars are laid over the top

Any `process.env` vars that you want to be included in this should be specified in the `envsToInclude` variable in `configuration.ts`. They should be the exact lowercase version of the environment variable name.
