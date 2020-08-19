"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExportVariablesRule = ExportVariablesRule;

var _GraphQLError = require("../../../error/GraphQLError");

var _definition = require("../../../type/definition");

var _visitor = require("../../../language/visitor");

var _ValidationContext = require("../../ValidationContext");

/**
 * Rule for the export variable directive
 *
 * A GraphQL document is only valid if all exported variables have been declared,
 * are bound to the correct scalar field type, has no default value, and is
 * exported before being referenced.
 */
function ExportVariablesRule(context) {
  var exportedVariables = Object.create(null);
  return {
    OperationDefinition: {
      leave: function leave(operation) {
        var exportDirective = context.getSchema().getDirective('export');
        if (exportDirective === undefined) return; // exported variables must not have any default value

        for (var _i2 = 0, _operation$variableDe2 = operation.variableDefinitions; _i2 < _operation$variableDe2.length; _i2++) {
          var variable = _operation$variableDe2[_i2];
          var variableName = variable.variable.name.value;

          if (exportedVariables[variableName] !== undefined) {
            if (variable.defaultValue !== undefined) {
              context.reportError(new _GraphQLError.GraphQLError("Exported variable \"$".concat(variableName, "\" cannot have a default value")));
            } // add directive as value of variable


            variable.directives.push(exportDirective.astNode);
          }
        } // check variable usage


        var usages = context.getRecursiveVariableUsages(operation);

        for (var _i4 = 0; _i4 < usages.length; _i4++) {
          var _ref2 = usages[_i4];
          var node = _ref2.node;
          var type = _ref2.type;
          var _variableName = node.name.value;

          if (exportedVariables[_variableName]) {
            var exportedVariableType = exportedVariables[_variableName].type; // exported variable must be correct type

            isValidType(_variableName, type, exportedVariableType, context); // exported variable must be defined before it is referenced

            if (exportedVariables[_variableName].loc.start > node.loc.start) {
              context.reportError(new _GraphQLError.GraphQLError("Exported variable $".concat(_variableName, " referenced before assignment")));
            } // remove from list of exported variables


            delete exportedVariables[_variableName];
          }
        } // all exported variables declared?


        for (var _i6 = 0, _Object$keys2 = Object.keys(exportedVariables); _i6 < _Object$keys2.length; _i6++) {
          var _variableName2 = _Object$keys2[_i6];
          context.reportError(new _GraphQLError.GraphQLError("Exported variable \"$".concat(_variableName2, "\" is referenced but never declared")));
        }
      }
    },
    Field: function Field(node) {
      if (node.directives.length > 0) {
        for (var _i8 = 0, _node$directives2 = node.directives; _i8 < _node$directives2.length; _i8++) {
          var directive = _node$directives2[_i8];

          if (directive.name.value === 'export') {
            var as = directive.arguments[0].value.value;

            if (exportedVariables[as] !== undefined) {
              context.reportError(new _GraphQLError.GraphQLError("Variable \"$".concat(as, "\" has already been exported")), [node]);
            }

            exportedVariables[as] = {
              'type': context.getType(),
              'loc': node.loc
            };
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
    isValidType(variableName, (0, _definition.getNamedType)(type1), (0, _definition.getNamedType)(type2), context);
  } else if (type1 !== type2) {
    context.reportError(new _GraphQLError.GraphQLError("Variable \"$".concat(variableName, "\" of type \"").concat(type1, "\" exported from field of type \"").concat(type2, "\"")));
  }
}
