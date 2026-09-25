import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * A book in the catalogue.
 *
 * The same class is both the TypeORM entity (database table) and the GraphQL
 * object type. For a model this small, one definition avoids keeping two
 * identical classes in sync. If the API and the table ever need to diverge,
 * they can be split then.
 */
@ObjectType({ description: 'A book in the catalogue.' })
@Entity({ name: 'books' })
export class Book {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Field()
  @Column({ type: 'varchar', length: 1000 })
  description!: string;
}
