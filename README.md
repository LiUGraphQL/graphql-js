See the original graphql-js README in the offical repo: https://github.com/graphql/graphql-js

# woo.sh fork of GraphQL.js

This is a fork of the JavaScript reference implementation for GraphQL. The woosh [branch](https://github.com/LiUGraphQL/graphql-js/tree/woosh) contains a modified version of the library, where the `executeFieldsSerially` function in `execute.js` has been modified to enable support for transactions over an entire mutation request. The default behaviour only allows transaction support for individual fields within a mutation, which are then executed asynchronsously. The modified library passes a list of the mutation fields as part of the shared `context` object, which allows the GraphQL server to keep track of the mutation fields that are still pending processing. Promises are resolved only after all fields have been processed in sequence.

The field `exeContext.contextValue.responseFields` (accessed from the GraphQL `context` object) contains an array of pending mutation fields, which can be used as a trigger for executing a transaction. For implementations ignoring this field the library behaves exactly as the reference implementation.

# Usage
The [npm branch](https://github.com/LiUGraphQL/graphql-js/tree/npm) of this repository is manually maintained to be used as an npm dependency. You may install the library from the command line using:
```bash
npm install graphql@git://github.com/LiUGraphQL/graphql-js.git#npm
```

or simply reference it as a dependency in your `packages.json` file:
```json
"dependencies": {
  "graphql": "LiUGraphQL/graphql-js.git#npm",
 }
 ```

# Developers
To publish new changes to the you need to publish the updated library by running the `gitpublish.sh` script. This will build and push the library to the [npm branch](https://github.com/LiUGraphQL/graphql-js/tree/npm).

