import { ASTVisitor } from '../../language/visitor';
import { ValidationContext } from '../ValidationContext';

/**
 * Export directives
 *
 * A GraphQL document is only valid if all exported variables are bound to the
 * valid field type.
 */
export function KnownDirectivesRule(
  context: ValidationContext,
): ASTVisitor;
