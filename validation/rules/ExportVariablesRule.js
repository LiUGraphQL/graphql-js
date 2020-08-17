"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExportVariablesRule = ExportVariablesRule;

var _typeFromAST = require("../../utilities/typeFromAST");

var _GraphQLError = require("../../error/GraphQLError");

var _definition = require("../../type/definition");

var _visitor = require("../../language/visitor");

var _ValidationContext = require("../ValidationContext");

/**
 * Export directives
 *
 * A GraphQL document is only valid if all exported variables are bound to the
 * valid field type.
 */
function ExportVariablesRule(context) {
  var exportedVariables = Object.create(null);
  return {
    OperationDefinition: {
      leave: function leave(operation) {
        var exportDirective = context.getSchema().getDirective('export');

        if (exportDirective === undefined) {
          return;
        }

        for (var _i2 = 0, _operation$variableDe2 = operation.variableDefinitions; _i2 < _operation$variableDe2.length; _i2++) {
          var variable = _operation$variableDe2[_i2];
          var variableName = variable.variable.name.value;

          if (exportedVariables[variableName]) {
            var variableType = (0, _typeFromAST.typeFromAST)(context.getSchema(), variable.type);
            var exportedVariableType = exportedVariables[variableName];
            isValidType(variableName, variableType, exportedVariableType, context); // add the astNode of the directive to the variable

            variable.directives.push(exportDirective.astNode);
            delete exportedVariables[variableName];
          }
        }

        for (var _i4 = 0, _Object$keys2 = Object.keys(exportedVariables); _i4 < _Object$keys2.length; _i4++) {
          var _variableName = _Object$keys2[_i4];
          context.reportError(new _GraphQLError.GraphQLError("Exported variable \"$".concat(_variableName, "\" referenced but not declared")));
        }
      }
    },
    Field: function Field(node) {
      if (node.directives.length > 0) {
        for (var _i6 = 0, _node$directives2 = node.directives; _i6 < _node$directives2.length; _i6++) {
          var directive = _node$directives2[_i6];

          if (directive.name.value === 'export') {
            var as = directive.arguments[0].value.value;

            if (exportedVariables[as] !== undefined) {
              context.reportError(new _GraphQLError.GraphQLError("Variable \"$".concat(as, "\" has already been exported")), [node]);
            }

            exportedVariables[as] = context.getType();
          }
        }
      }
    }
  };
}
/**
 * Verify that the variable type matches the exported field type. The exported field type must be at least as strict
 * as the variable definition (i.e., if the variable is a non-null type then the field exported must be non-null).
 *
 * @param variableType
 * @param exportedType
 */


function isValidType(variableName, variableType, exportedType, context) {
  // check nullable
  if (!(0, _definition.isNullableType)(variableType) && (0, _definition.isNullableType)(exportedType)) {
    context.reportError(new _GraphQLError.GraphQLError("Variable \"$".concat(variableName, "\" of required type \"").concat(variableType, "\" exported from field of type \"").concat(exportedType, "\"")));
    return;
  }

  var type1 = (0, _definition.getNullableType)(variableType);
  var type2 = (0, _definition.getNullableType)(exportedType);

  if ((0, _definition.isListType)(type1) && (0, _definition.isListType)(type2)) {
    type1 = (0, _definition.getNamedType)(type1);
    type2 = (0, _definition.getNamedType)(type2);
    isValidType(variableName, type1, type2, context);
  } else if (type1 !== type2) {
    context.reportError(new _GraphQLError.GraphQLError("Variable \"$".concat(variableName, "\" of type \"").concat(type1, "\" exported from field of type \"").concat(type2, "\"")));
  }
}
