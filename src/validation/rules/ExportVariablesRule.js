// @flow strict

import { typeFromAST } from '../../utilities/typeFromAST';
import { GraphQLError } from '../../error/GraphQLError';
import { getNamedType, getNullableType, isListType, isNullableType } from '../../type/definition';
import { ASTVisitor } from '../../language/visitor';
import { ValidationContext } from '../ValidationContext';

/**
 * Export directives
 *
 * A GraphQL document is only valid if all exported variables are bound to the
 * valid field type.
 */
export function ExportVariablesRule(
  context: ValidationContext,
): ASTVisitor {
  const exportedVariables = Object.create(null);
  return {
    OperationDefinition: {
      leave: function leave(operation) {
        const exportDirective = context.getSchema().getDirective('export');
        if(exportDirective === undefined){
          return;
        }

        for(const variable of operation.variableDefinitions){
          const variableName = variable.variable.name.value;
          if(exportedVariables[variableName]) {
            const variableType = typeFromAST(context.getSchema(), variable.type);
            const exportedVariableType = exportedVariables[variableName];
            isValidType(variableName, variableType, exportedVariableType, context);
            // add the astNode of the directive to the variable
            variable.directives.push(exportDirective.astNode);
          }
        }
      }
    },
    Field: function Field(node) {
      if(node.directives.length > 0) {
        for(const directive of node.directives) {
          if(directive.name.value === 'export'){
            const as = directive.arguments[0].value.value;
            if (exportedVariables[as] !== undefined) {
              context.reportError(new GraphQLError(`Variable "$${as}" has already been exported`), [node]);
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
  if(!isNullableType(variableType) && isNullableType(exportedType)){
    context.reportError(new GraphQLError(`Variable "$${variableName}" of required type "${variableType}" exported from field of type "${exportedType}"`));
    return;
  }

  let type1 = getNullableType(variableType);
  let type2 = getNullableType(exportedType);
  if(isListType(type1) && isListType(type2)){
    type1 = getNamedType(type1);
    type2 = getNamedType(type2);
    isValidType(variableName, type1, type2, context);
  } else if(type1 !== type2){
    context.reportError(new GraphQLError(`Variable "$${variableName}" of type "${type1}" exported from field of type "${type2}"`));
  }
}
