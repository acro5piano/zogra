import {
  EnumType,
  Gql,
  type Field,
  type InputFieldMap,
  type ScalarType,
} from 'gqtx'
import { z } from 'zod'
import { keys } from './object-util'
import { DateTimeScalar } from './DateTimeScalar'

const enumMap: Record<string, EnumType<any>> = {}

export function zodScalarToGqlScalar(
  zodType: z.ZodType,
): null | ScalarType<any> {
  if (
    zodType instanceof z.ZodOptional ||
    zodType instanceof z.ZodNullable ||
    zodType instanceof z.ZodBranded
  ) {
    return zodScalarToGqlScalar(zodType.unwrap())
  }
  if (zodType instanceof z.ZodString) {
    if (zodType.isUUID) {
      return Gql.ID
    } else {
      return Gql.String
    }
  }
  if (zodType instanceof z.ZodBoolean) {
    return Gql.Boolean
  }
  if (zodType instanceof z.ZodDate) {
    return DateTimeScalar
  }
  if (zodType instanceof z.ZodEnum) {
    if (!zodType.description) {
      throw new Error(
        'Unable to enum description. Please run z.enum().describe("EnumName")',
      )
    }
    const e = enumMap[zodType.description]
    if (!e) {
      throw new Error('Enum is not registered')
    }
    // @ts-ignore: why???
    return e
  }
  if (zodType instanceof z.ZodNumber) {
    if (zodType.isInt) {
      return Gql.Int
    } else {
      return Gql.Float
    }
  }
  return null
}

export function zodTypeToGqlFields<T extends z.ZodRawShape>(
  publicFields: z.ZodObject<T>,
  ...additionalFields: Field<z.infer<z.ZodObject<T>>, any, {}>[]
) {
  type F = any
  type GqlFields = [Field<F, any, {}>, ...Field<F, any, {}>[]]
  // @ts-ignore
  const fields: GqlFields = [
    // Gql.Field({ name: 'id', type: Gql.NonNull(Gql.ID) }),
  ]
  for (const key of keys(publicFields.shape)) {
    const value = publicFields.shape[key]
    const gqlType = zodScalarToGqlScalar(value)
    if (gqlType) {
      if (value.isNullable() || value.isOptional()) {
        fields.push(Gql.Field({ name: key as string, type: gqlType }))
      } else {
        fields.push(
          Gql.Field({ name: key as string, type: Gql.NonNull(gqlType) }),
        )
      }
    }
  }
  for (const f of additionalFields) {
    fields.push(f)
  }
  return fields
}

export function zodTypeToGqlInputFields<Src, T extends z.ZodRawShape>(
  inputFields: z.ZodObject<T>,
): InputFieldMap<Src> {
  const fields: InputFieldMap<any> = {}
  for (const key of keys(inputFields.shape)) {
    const value = inputFields.shape[key]
    const gqlType = zodScalarToGqlScalar(value)
    if (gqlType) {
      if (value.isNullable() || value.isOptional()) {
        fields[key] = { type: gqlType }
      } else {
        fields[key] = { type: Gql.NonNullInput(gqlType) }
      }
    }
  }
  return fields
}

export function zodTypeToGqlEnum(enu: z.ZodEnum<any>) {
  if (!enu.description) {
    throw new Error(
      'Unable to enum description. Please run z.enum().describe("EnumName")',
    )
  }
  const e = Gql.Enum({
    name: enu.description,
    values: keys(enu.enum).map((key) => ({ name: key, value: key })),
  })
  enumMap[enu.description] = e
  return e
}
