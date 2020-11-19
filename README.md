<div align="center">
<img src="https://github.com/b-pagis/ufonaut/blob/master/assets/logo.png?raw=true">
<hr />
CLI for converting <a href="https://swagger.io/specification/">open api</a> documentation to postman collection with additional options for integration testing
</div>
<hr />

[![version][version-badge]][package]
![Build][build]
![Lint][lint]
[![Coverage](https://codecov.io/gh/b-pagis/ufonaut/branch/master/graph/badge.svg)](https://codecov.io/gh/b-pagis/ufonaut)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Conventional Commits][conventional-commits-image]][conventional-commits-url]
![License][license]

# ❯ Installation

Use the package manager [npm][npm] which is bundled with [node][node] to install `ufonaut`.

```bash
npm install -g @b-pagis/ufonaut
```

# ❯ Usage

> :scroll: NOTICE: By default this utility, when converting, replaces request _body_, _header_ and _query_ parameters' values with interpolated parameter names. As an example `"keyName":"<string>"` will be replaced with `"keyName":"{{keyName}}"`. This gives flexibility and ability to contain all information in variables.

## Run interactive mode

```bash
ufonaut
```

or

```bash
ufonaut cli
```

![interactive mode](https://github.com/b-pagis/ufonaut/blob/master/assets/interactive-preview.gif?raw=true)

## Convert Open API documentation to postman collection

```bash
ufonaut convert -i [file-location] -o [output-file-location]
```

### Other options

| Short flag | Long name                          | Required | Description                                                                                                                                      |
| ---------- | ---------------------------------- | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| -i         | --input                            |   yes    | Local path or remote URL to open api JSON file.                                                                                                  |
| -o         | --output                           |   yes    | File path where postman collection will be saved.                                                                                                |
| -d         | --order                            |          | Path to [order](#ordering) config JSON file.                                                                                                     |
| -s         | --scripts                          |          | Path to [scripts](#scripts) catalog containing `test` and `pre-request` catalogs with corresponding script files.                                |
| -u         | --username                         |          | In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth username.                  |
| -p         | --password                         |          | In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth password.                  |
| -x         | --x-api-key                        |          | In case open api file is accessed by URL that is protected with X-API-KEY header, this option is used to provide X-API-KEY header value.         |
| -b         | --bearer-token                     |          | In case open api file is accessed by URL that is protected with Bearer token, this option is used to provide Authorization: Bearer header value. |
| -cr        | --rename                           |          | Postman collection's name.                                                                                                                       |
| -ca        | --collection-auth-type             |          | Postman Collection's auth type [basic, apikey, bearer]. Will only affect those endpoints that are using some kinds of authentication option.     |
| -cu        | --collection-basic-auth-username   |          | Postman Collection's basic auth username.                                                                                                        |
| -cp        | --collection-basic-auth-password   |          | Postman Collection's basic auth password.                                                                                                        |
| -ck        | --collection-api-key-auth-key      |          | Postman Collection's api key auth key (default: "X-API-KEY").                                                                                    |
| -cv        | --collection-api-key-auth-value    |          | Postman Collection's api key auth key value.                                                                                                     |
| -cl        | --collection-api-key-auth-location |          | Postman Collection's api key auth location [header, query] (default: "header").                                                                  |
| -cb        | --collection-bearer-auth-token     |          | Postman Collection's bearer auth token value.                                                                                                    |
| -cf        | --collection-forced-auth           |          | Force to use specified auth type for all endpoints (default: false).                                                                             |
| -t         | --script-template                  |          | Path to scripts template catalog.                                                                                                                |

## Create a set

```bash
ufonaut create-sets -i [file-location] -o [output-file-location] -c [sets-config-location]
```

### Other options

| Short flag | Long name      | Required | Description                                                                                                                                      |
| ---------- | -------------- | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| -i         | --input        |   yes    | Local path or remote URL to open api JSON file.                                                                                                  |
| -c         | --sets-config  |   yes    | Path to [sets](#sets) config JSON file.                                                                                                          |
| -o         | --output       |   yes    | Path where to output sets collections.                                                                                                           |
| -u         | --username     |          | In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth username.                  |
| -p         | --password     |          | In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth password.                  |
| -x         | --x-api-key    |          | In case open api file is accessed by URL that is protected with X-API-KEY header, this option is used to provide X-API-KEY header value.         |
| -b         | --bearer-token |          | In case open api file is accessed by URL that is protected with Bearer token, this option is used to provide Authorization: Bearer header value. |

## List endpoints in open api documentation

```bash
ufonaut endpoints -i [file-location]
```

### Other options

| Short flag | Long name      | Required | Description                                                                                                                                      |
| ---------- | -------------- | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| -i         | --input        |   yes    | Local path or remote URL to open api JSON file.                                                                                                  |
| -n         | --normalized   |          | In addition, outputs normalized endpoint path that could be used for script files.                                                               |
| -t         | --output-type  |          | Output file type [md, csv]. By default prints to console.                                                                                        |
| -o         | --output       |          | Output file location.                                                                                                                            |
| -u         | --username     |          | In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth username.                  |
| -p         | --password     |          | In case open api file is accessed by URL that is protected with basic auth, this option is used to provide basic auth password.                  |
| -x         | --x-api-key    |          | In case open api file is accessed by URL that is protected with X-API-KEY header, this option is used to provide X-API-KEY header value.         |
| -b         | --bearer-token |          | In case open api file is accessed by URL that is protected with Bearer token, this option is used to provide Authorization: Bearer header value. |

## Ordering

Option that allows ordering endpoints in the specified way. This option will provide postman collection with flat structure. Not specified endpoints are included into the list after ordered ones.

### Config file example

```json
{
  "order": [
    {
      "method": "post",
      "path": "user"
    },
    {
      "method": "post",
      "path": "store/order"
    },
    {
      "method": "get",
      "path": "pet/findByStatus"
    }
  ]
}
```

## Sets

Option that allows to create small postman collections for dedicated scenarios.

### Config options

| Key                                        | Type    | Required | Description                                                                                                                                                                                       |
| ------------------------------------------ | ------- | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sets                                       | array   |   yes    | Array of sets configs.                                                                                                                                                                            |
| sets[].collectionName                      | string  |   yes    | Name for the set. Value will be used for both - postman collection name and exported file name.                                                                                                   |
| sets[].scriptsPath                         | string  |          | Path to [scripts](#scripts) catalog containing `test` and `pre-request` catalogs with script files.                                                                              |
| sets[].template.preRequestTemplateFilePath | string  |          | Path to `pre-request` [template](#script-templates) catalog.                                                                                                                                        |
| sets[].auth                                | object  |          | Authentication settings for endpoints in the collection.                                                                                                                                          |
| sets[].auth.type                           | enum    |          | Postman Collection's auth type [basic, apikey, bearer].                                                                                                                                           |
| sets[].auth.forced                         | boolean |          | Force to use specified auth type for all endpoints.                                                                                                                                               |
| sets[].auth.basic                          | object  |          | Configuration for basic authentication type. Cannot be used with `apikey` or `bearer`.                                                                                                            |
| sets[].auth.basic.username                 | string  |          | Postman Collection's basic auth username.                                                                                                                                                         |
| sets[].auth.basic.password                 | string  |          | Postman Collection's basic auth password.                                                                                                                                                         |
| sets[].auth.apikey                         | object  |          | Configuration for api key authentication type. Cannot be used with `basic` `bearer`.                                                                                                              |
| sets[].auth.apikey.location                | enum    |          | Postman Collection's api key auth location. Possible values - `header`, `query`.                                                                                                                  |
| sets[].auth.apikey.key                     | string  |          | Postman Collection's api key auth key.                                                                                                                                                            |
| sets[].auth.apikey.value                   | string  |          | Postman Collection's api key auth key value.                                                                                                                                                      |
| sets[].auth.bearer                         | object  |          | Configuration for Bearer token authentication type. Cannot be used with `basic`, `apikey`.                                                                                                        |
| sets[].auth.bearer.token                   | string  |          | Postman Collection's bearer auth token value that will be added to `Authorization: Bearer` header.                                                                                                |
| sets[].order                               | array   |   yes    | List of endpoints for following set. It is the same configuration as [order config](#ordering), with the only exception that endpoints that are not provided in following list will be discarded. |

### Config example

```json
{
  "sets": [
    {
      "collectionName": "pc-sets-store-example",
      "scriptsPath": "examples/scripts",
      "template": {
        "preRequestTemplateFilePath": "examples/scripts/template/pre-request.template"
      },
      "auth": {
        "type": "basic",
        "forced": false,
        "basic": {
          "username": "user",
          "password": "user-password"
        }
      },
      "order": [
        {
          "method": "post",
          "path": "store/order"
        },
        {
          "method": "get",
          "path": "store/order/:orderId"
        },
        {
          "method": "get",
          "path": "store/inventory"
        }
      ]
    },
    {
      "collectionName": "pc-sets-pet-example",
      "auth": {
        "type": "apikey",
        "apikey": {
          "location": "header",
          "key": "x-my-key",
          "value": "key-123"
        }
      },
      "order": [
        {
          "method": "get",
          "path": "pet/findByStatus"
        },
        {
          "method": "put",
          "path": "pet"
        },
        {
          "method": "get",
          "path": "pet/findByTags"
        },
        {
          "method": "delete",
          "path": "pet/:petId"
        },
        {
          "method": "post",
          "path": "pet"
        }
      ]
    }
  ]
}
```

> :scroll: NOTICE: Only those endpoints that are specified in set config will be included into set.

## Scripts

When storing everything in variables, it becomes possible to have some kind of content manipulation in either `pre-request` or `test` tab. This options gives possibility to load `pre-request` and `test` scripts from files to endpoints. However this option enforces some path and file name rules.

### Path rules

Path must contain two catalogs that are named `pre-request` and `test` in it.

### File name

Each catalog must contain a `.js` file with following rules `method-path`, where:

- method - is HTTP method (e.g. post, get, etc)
- path - is full path to the resource with removed non letter symbols, except dash, from it and placed in lowercase. E.g. for endpoint that is named `GET /pet/findByStatus-example` - the file name must be `get-petfindbystatus-example.js`.

### Catalog structure example

```
.
├── scripts
    ├── pre-request
    │   └── get-petfindbystatus-example.js
    └── test
        └── get-petfindbystatus-example.js

```

## Script templates

Postman does not allow direct body manipulation (see [#4808](https://github.com/postmanlabs/postman-app-support/issues/4808)). The only way to do it, is to put request body into variable that can be used in `pre-request` script, but doing it manually is very tedious task. With this option it is possible to automate this task, by creating a template that will be used in every endpoint that has request body.

Template supports following parameters:

- `requestBody` - will be replaced by actual request body. In the request tab a `{{requestBody}}` parameter will be placed instead of actual request.
- `scriptContent` - will be replaced with the content of `pre-request` [script](#scripts) file.

Parameters must be entered between `<%%=` and `=%%>`.

### Template example

```js
var requestBody = <%%=requestBody=%%>;

<%%=scriptContent=%%>

pm.environment.set('requestBody', JSON.stringify(requestBody));

```

# ❯ Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

> :scroll: NOTICE: if you are working on Windows, then following scripts will not work

- `refresh`,
- `clean:all`,
- `clean:lib`,
- `build`,
- `start`

This is because `rm -rf` command is used. Please adjust it locally and please avoid committing updated commands. Thank you in advance for your contribution.

# ❯ License

[ISC][isc]

[isc]: https://choosealicense.com/licenses/isc
[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[license]: https://img.shields.io/github/license/b-pagis/ufonaut
[conventional-commits-image]: https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg
[conventional-commits-url]: https://conventionalcommits.org/
[version-badge]: https://img.shields.io/npm/v/@b-pagis/ufonaut
[package]: https://www.npmjs.com/package/@b-pagis/ufonaut
[build]: https://github.com/b-pagis/ufonaut/workflows/Test/badge.svg
[lint]: https://github.com/b-pagis/ufonaut/workflows/Lint/badge.svg
