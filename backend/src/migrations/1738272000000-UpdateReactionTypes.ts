import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReactionTypes1738272000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Alte Enum-Values zu 'like' konvertieren (sad, angry)
    await queryRunner.query(`
      UPDATE profile_comment_reactions
      SET type = 'like'
      WHERE type IN ('sad', 'angry')
    `);

    // 2. Altes Enum löschen und neues erstellen
    await queryRunner.query(`
      ALTER TABLE profile_comment_reactions
      ALTER COLUMN type TYPE VARCHAR(20)
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS profile_comment_reactions_type_enum
    `);

    await queryRunner.query(`
      CREATE TYPE profile_comment_reactions_type_enum AS ENUM (
        'like', 'love', 'laugh', 'wow',
        'fire', 'idea', 'party', 'clap',
        'poop', 'clown', 'sleepy', 'vomit'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE profile_comment_reactions
      ALTER COLUMN type TYPE profile_comment_reactions_type_enum
      USING type::profile_comment_reactions_type_enum
    `);

    await queryRunner.query(`
      ALTER TABLE profile_comment_reactions
      ALTER COLUMN type SET DEFAULT 'like'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Neue Types zu 'like' konvertieren
    await queryRunner.query(`
      UPDATE profile_comment_reactions
      SET type = 'like'
      WHERE type IN ('fire', 'idea', 'party', 'clap', 'poop', 'clown', 'sleepy', 'vomit')
    `);

    // Altes Enum wiederherstellen
    await queryRunner.query(`
      ALTER TABLE profile_comment_reactions
      ALTER COLUMN type TYPE VARCHAR(20)
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS profile_comment_reactions_type_enum
    `);

    await queryRunner.query(`
      CREATE TYPE profile_comment_reactions_type_enum AS ENUM (
        'like', 'love', 'laugh', 'wow', 'sad', 'angry'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE profile_comment_reactions
      ALTER COLUMN type TYPE profile_comment_reactions_type_enum
      USING type::profile_comment_reactions_type_enum
    `);

    await queryRunner.query(`
      ALTER TABLE profile_comment_reactions
      ALTER COLUMN type SET DEFAULT 'like'
    `);
  }
}
