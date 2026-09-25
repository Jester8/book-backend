import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Maximum lengths, matching the column sizes in the migration. */
export const BOOK_NAME_MAX = 120;
export const BOOK_DESCRIPTION_MAX = 1000;

/** Trims strings before validation, so "   " counts as empty. */
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/**
 * Input for `createBook`. The global ValidationPipe rejects the request
 * before it reaches the resolver if any rule here fails.
 */
@InputType()
export class CreateBookInput {
  @Field()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Name is required.' })
  @MaxLength(BOOK_NAME_MAX, { message: `Name must be at most ${BOOK_NAME_MAX} characters.` })
  name!: string;

  @Field()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Description is required.' })
  @MaxLength(BOOK_DESCRIPTION_MAX, { message: `Description must be at most ${BOOK_DESCRIPTION_MAX} characters.` })
  description!: string;
}
