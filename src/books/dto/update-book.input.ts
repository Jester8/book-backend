import { InputType, PartialType } from '@nestjs/graphql';
import { CreateBookInput } from './create-book.input';

/**
 * Input for `updateBook`. Every field is optional, so a client can change
 * just the name or just the description. `PartialType` keeps the validation
 * rules from `CreateBookInput` for any field that is sent.
 */
@InputType()
export class UpdateBookInput extends PartialType(CreateBookInput) {}
