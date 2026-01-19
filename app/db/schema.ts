import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // matches session.user.id (e.g., "github-123456")
  displayName: varchar('display_name', { length: 50 }),
  profilePicture: varchar('profile_picture', { length: 255 }), // filename, nullable
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  imgFilename: varchar('img_filename', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  order: integer('order').notNull(),
  src: varchar('src', { length: 500 }).notNull(),
  alt: varchar('alt', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('photos_user_id_idx').on(table.userId),
}));
