import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Creates the `books` table that backs the `Book` entity. */
export class CreateBooks1758800000000 implements MigrationInterface {
  name = 'CreateBooks1758800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "books" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar(120) NOT NULL,
        "description" varchar(1000) NOT NULL
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "books"`);
  }
}
