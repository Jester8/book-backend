import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Book } from './book.entity';
import type { CreateBookInput } from './dto/create-book.input';
import type { UpdateBookInput } from './dto/update-book.input';

/**
 * Business logic for books. The resolver only translates GraphQL calls into
 * these methods, so the rules live in one place and can be unit tested
 * without GraphQL or HTTP.
 */
@Injectable()
export class BooksService {
  constructor(@InjectRepository(Book) private readonly books: Repository<Book>) {}

  /** All books, oldest first, which matches the order the table shows. */
  findAll(): Promise<Book[]> {
    return this.books.find({ order: { id: 'ASC' } });
  }

  /** One book, or a NotFoundException that surfaces as a clear GraphQL error. */
  async findOne(id: number): Promise<Book> {
    const book = await this.books.findOneBy({ id });
    if (!book) throw new NotFoundException(`Book ${id} was not found.`);
    return book;
  }

  create(input: CreateBookInput): Promise<Book> {
    return this.books.save(this.books.create(input));
  }

  /** Applies only the fields that were sent, leaving the rest untouched. */
  async update(id: number, input: UpdateBookInput): Promise<Book> {
    const book = await this.findOne(id);
    return this.books.save(this.books.merge(book, input));
  }

  /**
   * Deletes a book and returns its id. The client uses the id to evict the
   * book from its cache, which is all it needs once the row is gone.
   */
  async remove(id: number): Promise<number> {
    const book = await this.findOne(id);
    await this.books.remove(book);
    return id;
  }
}
