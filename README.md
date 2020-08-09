See the original graphql-js README in the offical repo: https://github.com/graphql/graphql-js

# woo.sh fork of GraphQL.js

This is a fork of the JavaScript reference implementation for GraphQL. The modifications described below have been implemented in the woosh [branch](https://github.com/LiUGraphQL/graphql-js/tree/woosh).

# Enhanced transaction support
The default behavior of the `executeFieldsSerially` function in `execute.js` supports transactions only for individual fields within a mutation, since thefields themselves are executed asynchronsously. This modified library keeps a list of the current mutation fields as part of the shared `context` object and the promises returned are bound to corresponding fields only after all fields have been processed. The GraphQL function binds the pending mutation fields to `exeContext.contextValue.responseFields`, which can be accessed and used as a trigger via the GraphQL `context` object. This field can be ignored to achieve the default library behavior.

# Support for dependent operations in a mutation request
The library adds support for the `export` directive, where a selected scalar value field can be bound to decalred variable. This value can then be used in subsequent operations. For example, the following query binds the ID of a created blogger to the variable `blogger`, which is used as the value for the field `connect` for creating a new blog object.

*Note: Type validation for exported variables is only partially supported at this time.*

```graphql
mutation ($blogger:ID!) {
  createBlogger(data:{
    name: "John Doe"
  }){
    id @export(as: "blogger")
  }
  createBlog(data: {
    text:"Who am I really?"
    author: {
      connect: $blogger
    }
  }){
    id
    author {
      id
    }
  }
}
```


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
To publish new changes to the you need to publish the updated library by running the `gitpublish.sh` script. This will build and push the library to the [npm branch](https://github.com/LiUGraphQL/graphql-js/tree/npm). For publishing development work as an `npm` dependency, please instead use `gitpublish-dev.sh` that pushes to the npm-dev branch.

