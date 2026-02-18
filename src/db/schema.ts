import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// Enums
export const userRoleEnum = pgEnum('UserRole', ['USER', 'ADMIN'])

// Tables
export const users = pgTable('User', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').default('USER').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const documents = pgTable(
  'Document',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text('title').notNull(),
    fileKey: text('fileKey'),
    fileName: text('fileName'),
    fileContentType: text('fileContentType'),
    fileSize: integer('fileSize'),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('Document_userId_idx').on(table.userId)]
)

export const userApiKeys = pgTable(
  'UserApiKey',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    hashedKey: text('hashedKey').unique(),
    prefix: text('prefix'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    lastUsedAt: timestamp('lastUsedAt'),
    revoked: boolean('revoked').default(false).notNull(),
  },
  (table) => [
    index('UserApiKey_userId_idx').on(table.userId),
    index('UserApiKey_hashedKey_idx').on(table.hashedKey),
  ]
)

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  apiKeys: many(userApiKeys),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
}))

export const userApiKeysRelations = relations(userApiKeys, ({ one }) => ({
  user: one(users, { fields: [userApiKeys.userId], references: [users.id] }),
}))
