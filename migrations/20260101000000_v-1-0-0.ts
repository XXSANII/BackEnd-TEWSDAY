import type { Knex } from 'knex';

/**
 * Add the BaseEntity audit columns (`isActiveFlag`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`) to a table.
 * `createdBy` / `updatedBy` hold the `userLogName` string written by the audit helpers, not a foreign key.
 */
function addBaseColumns(table: Knex.CreateTableBuilder) {
  table.boolean('isActiveFlag').notNullable().defaultTo(true);
  table.timestamp('createdAt', { useTz: true }).notNullable().defaultTo('now()');
  table.string('createdBy').notNullable().defaultTo('system');
  table.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo('now()');
  table.string('updatedBy').notNullable().defaultTo('system');
}

/**
 * v-1-0-0 - Starter-Pack baseline: User, AuthAccount, Session, Otp, File, ErrorLog and the template Example table.
 */
export async function up(knex: Knex): Promise<void> {
  // Extensions and fuzzy search threshold (read by `applySearch`)
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
  await knex.raw(
    `DO $$ BEGIN EXECUTE format('ALTER DATABASE %I SET pg_trgm.word_similarity_threshold = 0.3', current_database()); END $$;`
  );

  // User
  await knex.schema.createTable('User', (table) => {
    table.uuid('userId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('username', 100).notNullable();
    table.string('displayName', 150).notNullable();
    table.string('email', 255).notNullable();
    table.timestamp('emailVerifiedAt', { useTz: true }).nullable();
    table.string('phoneNumber', 30).nullable();
    table.timestamp('phoneVerifiedAt', { useTz: true }).nullable();
    table.string('role', 20).notNullable().defaultTo('user'); // systemRoleType: user | admin
    table.string('status', 20).notNullable().defaultTo('normal'); // userStatusType
    table.string('language', 10).notNullable().defaultTo('th'); // languageType
    table.uuid('profileImageId').nullable();
    table.uuid('coverImageId').nullable();
    table.jsonb('notificationSettings').notNullable().defaultTo(
      JSON.stringify({
        emailEnabled: true,
        chatEnabled: true,
        sessionReminders: true,
      })
    );
    table.timestamp('consentAcceptedAt', { useTz: true }).nullable(); // PDPA consent given at sign-up
    addBaseColumns(table);
  });
  await knex.raw('CREATE UNIQUE INDEX "uq_user_email" ON "User" (lower("email")) WHERE "isActiveFlag"');
  await knex.raw('CREATE UNIQUE INDEX "uq_user_username" ON "User" (lower("username")) WHERE "isActiveFlag"');
  await knex.raw('CREATE INDEX "idx_user_username_trgm" ON "User" USING gin ("username" gin_trgm_ops)');
  await knex.raw('CREATE INDEX "idx_user_displayName_trgm" ON "User" USING gin ("displayName" gin_trgm_ops)');

  // File
  await knex.schema.createTable('File', (table) => {
    table.uuid('fileId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('name').notNullable();
    table.text('path').notNullable();
    table.bigInteger('size').notNullable();
    table.string('type', 100).nullable();
    table.string('fileExtension', 20).nullable();
    table.boolean('isPublicFlag').notNullable().defaultTo(false);
    addBaseColumns(table);
  });
  await knex.raw('CREATE UNIQUE INDEX "uq_file_path" ON "File" ("path")');

  // Link the user images to File now that both tables exist
  await knex.schema.alterTable('User', (table) => {
    table.foreign('profileImageId').references('fileId').inTable('File');
    table.foreign('coverImageId').references('fileId').inTable('File');
  });

  // AuthAccount
  await knex.schema.createTable('AuthAccount', (table) => {
    table.uuid('authAccountId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('userId').notNullable().references('userId').inTable('User');
    table.string('provider', 20).notNullable(); // authProviderType: basic | google
    table.string('providerAccountId', 255).nullable(); // Google `sub`
    table.string('passwordHash', 255).nullable(); // basic only
    addBaseColumns(table);
  });
  await knex.raw(
    'CREATE UNIQUE INDEX "uq_authAccount_provider" ON "AuthAccount" ("provider", "providerAccountId") WHERE "providerAccountId" IS NOT NULL AND "isActiveFlag"'
  );
  await knex.raw('CREATE INDEX "idx_authAccount_userId" ON "AuthAccount" ("userId") WHERE "isActiveFlag"');

  // Session
  await knex.schema.createTable('Session', (table) => {
    table.uuid('sessionId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('userId').notNullable().references('userId').inTable('User');
    table.text('token').notNullable();
    table.timestamp('expiredAt', { useTz: true }).notNullable();
    table.specificType('ipAddress', 'inet').nullable();
    table.text('userAgent').nullable();
    table.string('deviceId', 100).nullable();
    addBaseColumns(table);
  });
  await knex.raw('CREATE UNIQUE INDEX "uq_session_token" ON "Session" ("token")');
  await knex.raw('CREATE INDEX "idx_session_userId" ON "Session" ("userId") WHERE "isActiveFlag"');
  await knex.raw('CREATE INDEX "idx_session_expiredAt" ON "Session" ("expiredAt") WHERE "isActiveFlag"');

  // Otp
  await knex.schema.createTable('Otp', (table) => {
    table.uuid('otpId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('userId').notNullable().references('userId').inTable('User');
    table.string('code', 20).notNullable();
    table.string('purpose', 50).notNullable(); // e.g. emailVerification | passwordReset
    table.timestamp('expiredAt', { useTz: true }).notNullable();
    addBaseColumns(table);
  });
  await knex.raw('CREATE INDEX "idx_otp_userId_purpose" ON "Otp" ("userId", "purpose") WHERE "isActiveFlag"');

  // ErrorLog
  await knex.schema.createTable('ErrorLog', (table) => {
    table.uuid('errorLogId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('apiName', 255).notNullable();
    table.text('message').notNullable();
    table.text('stack').nullable();
    addBaseColumns(table);
  });

  // Example (template module)
  await knex.schema.createTable('Example', (table) => {
    table.uuid('exampleId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    addBaseColumns(table);
  });
  await knex.raw('CREATE INDEX "idx_example_name_trgm" ON "Example" USING gin ("name" gin_trgm_ops)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('Example');
  await knex.schema.dropTableIfExists('ErrorLog');
  await knex.schema.dropTableIfExists('Otp');
  await knex.schema.dropTableIfExists('Session');
  await knex.schema.dropTableIfExists('AuthAccount');
  await knex.schema.alterTable('User', (table) => {
    table.dropForeign('profileImageId');
    table.dropForeign('coverImageId');
  });
  await knex.schema.dropTableIfExists('File');
  await knex.schema.dropTableIfExists('User');
  await knex.raw(
    `DO $$ BEGIN EXECUTE format('ALTER DATABASE %I RESET pg_trgm.word_similarity_threshold', current_database()); END $$;`
  );
}
