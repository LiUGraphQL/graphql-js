// @flow strict

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
        if(exportDirective === undefined) return;

        // exported variables must not have any default value
        for(const variable of operation.variableDefinitions) {
          const variableName = variable.variable.name.value;
          if(exportedVariables[variableName] !== undefined) {
            if (variable.defaultValue !== undefined) {
              context.reportError(new GraphQLError(`Exported variable "$${variableName}" cannot have a default value`));
            }
            // add directive as value of variable
            variable.directives.push(exportDirective.astNode);
          }
        }

        // check variable usage
        const usages = context.getRecursiveVariableUsages(operation);
        for (const { node, type } of usages) {
          const variableName = node.name.value;
          if(exportedVariables[variableName]) {
            const exportedVariableType = exportedVariables[variableName].type;
            // exported variable must be correct type
            isValidType(variableName, type, exportedVariableType, context);
            // exported variable must be defined before it is referenced
            if(exportedVariables[variableName].loc.start > node.loc.start){
              context.reportError(new GraphQLError(`Exported variable $${variableName} referenced before assignment`));
            }
            // remove from list of exported variables
            delete exportedVariables[variableName];
          }
        }
        // all exported variables declared?
        for (const variableName of Object.keys(exportedVariables){
          context.reportError(new GraphQLError(`Exported variable "$${variableName}" is referenced but never declared`));
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
            exportedVariables[as] = { 'type': context.getType(), 'loc': node.loc };
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
    isValidType(variableName, getNamedType(type1), getNamedType(type2), context);
  } else if(type1 !== type2){
    context.reportError(new GraphQLError(`Variable "$${variableName}" of type "${type1}" exported from field of type "${type2}"`));
  }
}
