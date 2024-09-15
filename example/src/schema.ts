import { Gql, buildGraphQLSchema } from '../dist'
import { z } from 'zod'

const ZodRoleEnum = z.enum(['ADMIN', 'USER'])

const ZodUserSchema = z.object({
  id: z.string().uuid(),
  role: ZodRoleEnum,
  name: z.string().min(3),
})
type User = z.infer<typeof UserSchema>

const users: User[] = [
  { id: '00000000-0000-0000-0000-000000000001', role: 'ADMIN', name: 'Sikan' },
  { id: '00000000-0000-0000-0000-000000000002', role: 'USER', name: 'Nicole' },
]

// We can declare the app context type once, and it will
// be automatically inferred for all our resolvers
declare module 'zogra' {
  interface GqlContext {
    viewerId: number
    users: User[]
  }
}

const RoleEnum = Gql.Enum('Role', ZodRoleEnum)

const UserType = Gql.Object('User', ZodUserSchema)

const Query = Gql.Query(() => ({
  userById: {
    type: UserType.nullish(),
    args: z.object({
      id: z.string().uuid(),
    }),
    resolve: (_, args, ctx) => {
      // `args` is automatically inferred as { id: string }
      // `ctx` (context) is also automatically inferred as { viewerId: number, users: User[] }
      const user = ctx.users.find((u) => u.id === args.id)
      // Also ensures we return an `User | null | undefined` type
      return user
    },
  },
}))

const schema = buildGraphQLSchema({
  query: Query,
})
