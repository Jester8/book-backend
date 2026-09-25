import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Book } from './book.entity';
import { BooksService } from './books.service';
import { CreateBookInput } from './dto/create-book.input';
import { UpdateBookInput } from './dto/update-book.input';

/**
 * GraphQL entry points for books.
 *
 * No auth decorators are needed here: the global GqlAuthGuard (see
 * AuthModule) runs before every resolver and rejects requests without a
 * valid Auth0 access token.
 */
@Resolver(() => Book)
export class BooksResolver {
  constructor(private readonly booksService: BooksService) {}

  @Query(() => [Book], { description: 'Every book in the catalogue.' })
  books(): Promise<Book[]> {
    return this.booksService.findAll();
  }

  @Query(() => Book, { description: 'A single book by id.' })
  book(@Args('id', { type: () => Int }) id: number): Promise<Book> {
    return this.booksService.findOne(id);
  }

  @Mutation(() => Book)
  createBook(@Args('input') input: CreateBookInput): Promise<Book> {
    return this.booksService.create(input);
  }

  @Mutation(() => Book)
  updateBook(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateBookInput,
  ): Promise<Book> {
    return this.booksService.update(id, input);
  }

  @Mutation(() => Int, { description: 'Deletes a book and returns the id it had.' })
  deleteBook(@Args('id', { type: () => Int }) id: number): Promise<number> {
    return this.booksService.remove(id);
  }
}
