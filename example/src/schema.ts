import { Gql, buildGraphQLSchema } from '../../src'
import { z } from 'zod'
import { User, ZodRoleEnum, ZodUserSchema } from './zod-types'

const users: User[] = [
  { id: '00000000-0000-0000-0000-000000000001', role: 'ADMIN', name: 'Sikan' },
  { id: '00000000-0000-0000-0000-000000000002', role: 'USER', name: 'Nicole' },
]

// We can declare the app context type once, and it will
// be automatically inferred for all our resolvers
declare module 'zogra' {
  interface GqlContext {
    viewerId: number
  }
}

Gql.Enum('Role', ZodRoleEnum)

const UserType = Gql.Object('User', ZodUserSchema)

const Query = Gql.Query({
  fields: () => ({
    userById: {
      type: Gql.NonNull(UserType),
      args: z.object({
        id: z.string().uuid(),
      }),
      resolve: (_, args, _ctx) => {
        args
        // `args` is automatically inferred as { id: string }
        // `ctx` (context) is also automatically inferred as { viewerId: number, users: User[] }
        const user = users.find((u) => u.id === args.id)
        // Also ensures we return an `User | null | undefined` type
        return user
      },
    },
  }),
})

export const schema = buildGraphQLSchema({
  query: Query,
})
