import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

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
