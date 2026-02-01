import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Skip if tables already exist (idempotent for existing databases)
    const categoriesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'categories'
      )
    `);

    if (categoriesExists[0].exists) {
      return;
    }

    // ============================================
    // ENUM TYPES
    // ============================================
    await queryRunner.query(`
      CREATE TYPE "friendships_status_enum" AS ENUM ('pending', 'accepted', 'blocked')
    `);

    await queryRunner.query(`
      CREATE TYPE "notifications_type_enum" AS ENUM (
        'friend_request', 'friend_accepted', 'new_rating',
        'comment_on_profile', 'comment_reaction', 'rating_vote'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "profile_comment_reactions_type_enum" AS ENUM (
        'like', 'love', 'laugh', 'wow',
        'fire', 'idea', 'party', 'clap',
        'poop', 'clown', 'sleepy', 'vomit'
      )
    `);

    // ============================================
    // TABLE: categories
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"),
        CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
      )
    `);

    // ============================================
    // TABLE: users
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" varchar(255) NOT NULL,
        "username" varchar(30) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "is_verified" boolean NOT NULL DEFAULT false,
        "avatar_url" varchar(500),
        "bio" text,
        "age" integer,
        "gender" varchar(10),
        "state" varchar(100),
        "signature" text,
        "profile_visibility" varchar(20) NOT NULL DEFAULT 'public',
        "allow_friend_requests_from" varchar(25) NOT NULL DEFAULT 'everyone',
        "online_status" boolean NOT NULL DEFAULT false,
        "last_seen" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "idx_users_username" ON "users" ("username")`);

    // ============================================
    // TABLE: products
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" SERIAL NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "brand" varchar(100),
        "category_id" integer NOT NULL,
        "rating" decimal(3,2) NOT NULL DEFAULT '0',
        "review_count" integer NOT NULL DEFAULT '0',
        "is_featured" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
      )
    `);

    // ============================================
    // TABLE: product_images
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id" SERIAL NOT NULL,
        "product_id" integer NOT NULL,
        "path" varchar(500) NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        "display_order" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id")
      )
    `);

    // ============================================
    // TABLE: refresh_tokens
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "token_hash" varchar(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "PK_7d8bee0204106019488c4c50132" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")`,
    );

    // ============================================
    // TABLE: email_verifications
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "email_verifications" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "token" varchar(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_email_verifications_token" UNIQUE ("token"),
        CONSTRAINT "PK_email_verifications" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_email_verifications_user_id" ON "email_verifications" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_email_verifications_token" ON "email_verifications" ("token")`,
    );

    // ============================================
    // TABLE: ratings
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "id" SERIAL NOT NULL,
        "product_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "price_performance" decimal(4,2) NOT NULL,
        "quality" decimal(4,2) NOT NULL,
        "ingredients" decimal(4,2) NOT NULL,
        "packaging" decimal(4,2) NOT NULL,
        "product_rating" decimal(4,2) NOT NULL,
        "title" varchar(100),
        "comment" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_ratings_product_user" UNIQUE ("product_id", "user_id"),
        CONSTRAINT "PK_0f31425b073219379545ad68ed9" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_ratings_product_id" ON "ratings" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "idx_ratings_user_id" ON "ratings" ("user_id")`);

    // ============================================
    // TABLE: rating_votes
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "rating_votes" (
        "id" SERIAL NOT NULL,
        "rating_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "type" varchar(10) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_rating_votes_rating_user" UNIQUE ("rating_id", "user_id"),
        CONSTRAINT "PK_rating_votes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_rating_votes_rating_id" ON "rating_votes" ("rating_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rating_votes_user_id" ON "rating_votes" ("user_id")`,
    );

    // ============================================
    // TABLE: friendships
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "friendships" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "friend_id" integer NOT NULL,
        "status" "friendships_status_enum" NOT NULL DEFAULT 'pending',
        "requested_by" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_friendships_user_friend" UNIQUE ("user_id", "friend_id"),
        CONSTRAINT "chk_friendships_canonical_order" CHECK ("user_id" < "friend_id"),
        CONSTRAINT "PK_friendships" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_friendships_user_status" ON "friendships" ("user_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_friendships_friend_status" ON "friendships" ("friend_id", "status")`,
    );

    // ============================================
    // TABLE: profile_comments
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "profile_comments" (
        "id" SERIAL NOT NULL,
        "profile_user_id" integer NOT NULL,
        "author_id" integer NOT NULL,
        "comment" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_profile_comments_no_self" CHECK ("author_id" <> "profile_user_id"),
        CONSTRAINT "PK_profile_comments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_profile_comments_profile_created" ON "profile_comments" ("profile_user_id", "created_at")`,
    );

    // ============================================
    // TABLE: profile_comment_reactions
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "profile_comment_reactions" (
        "id" SERIAL NOT NULL,
        "comment_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "type" "profile_comment_reactions_type_enum" NOT NULL DEFAULT 'like',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_pcr_comment_user" UNIQUE ("comment_id", "user_id"),
        CONSTRAINT "PK_profile_comment_reactions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_comment_reactions_comment" ON "profile_comment_reactions" ("comment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_comment_reactions_user" ON "profile_comment_reactions" ("user_id")`,
    );

    // ============================================
    // TABLE: notifications
    // ============================================
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "type" "notifications_type_enum" NOT NULL,
        "sender_id" integer,
        "reference_id" integer,
        "message" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user_read_created" ON "notifications" ("user_id", "is_read", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user_created" ON "notifications" ("user_id", "created_at")`,
    );

    // ============================================
    // FOREIGN KEYS
    // ============================================
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_product_images_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_verifications" ADD CONSTRAINT "FK_email_verifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_ratings_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_ratings_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rating_votes" ADD CONSTRAINT "FK_rating_votes_rating" FOREIGN KEY ("rating_id") REFERENCES "ratings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rating_votes" ADD CONSTRAINT "FK_rating_votes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" ADD CONSTRAINT "FK_friendships_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" ADD CONSTRAINT "FK_friendships_friend" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" ADD CONSTRAINT "FK_friendships_requester" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_comments" ADD CONSTRAINT "FK_profile_comments_profile_user" FOREIGN KEY ("profile_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_comments" ADD CONSTRAINT "FK_profile_comments_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_comment_reactions" ADD CONSTRAINT "FK_pcr_comment" FOREIGN KEY ("comment_id") REFERENCES "profile_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_comment_reactions" ADD CONSTRAINT "FK_pcr_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_sender"`,
    );
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
    await queryRunner.query(
      `ALTER TABLE "profile_comment_reactions" DROP CONSTRAINT "FK_pcr_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_comment_reactions" DROP CONSTRAINT "FK_pcr_comment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_comments" DROP CONSTRAINT "FK_profile_comments_author"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_comments" DROP CONSTRAINT "FK_profile_comments_profile_user"`,
    );
    await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_friendships_requester"`);
    await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_friendships_friend"`);
    await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_friendships_user"`);
    await queryRunner.query(`ALTER TABLE "rating_votes" DROP CONSTRAINT "FK_rating_votes_user"`);
    await queryRunner.query(`ALTER TABLE "rating_votes" DROP CONSTRAINT "FK_rating_votes_rating"`);
    await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_ratings_user"`);
    await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_ratings_product"`);
    await queryRunner.query(
      `ALTER TABLE "email_verifications" DROP CONSTRAINT "FK_email_verifications_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_product"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "profile_comment_reactions"`);
    await queryRunner.query(`DROP TABLE "profile_comments"`);
    await queryRunner.query(`DROP TABLE "friendships"`);
    await queryRunner.query(`DROP TABLE "rating_votes"`);
    await queryRunner.query(`DROP TABLE "ratings"`);
    await queryRunner.query(`DROP TABLE "email_verifications"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "categories"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "profile_comment_reactions_type_enum"`);
    await queryRunner.query(`DROP TYPE "notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "friendships_status_enum"`);
  }
}
