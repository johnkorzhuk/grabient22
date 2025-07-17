import type {
  coeffsSchema,
  collectionStyleValidator,
  globalsSchema,
} from './validators'
import * as v from 'valibot'
import type { Doc } from '../convex/_generated/dataModel'
import type { Tag } from '../tags'

// Cosine gradient types
export type CosineCoeffs = v.InferOutput<typeof coeffsSchema>
export type CosineGlobals = v.InferOutput<typeof globalsSchema>

// Serialized collection type
export interface AppCollection
  extends Omit<Doc<'collections'>, 'coeffs' | 'globals'> {
  coeffs: CosineCoeffs
  globals: CosineGlobals
  tagMatches?: Tag[]
}

export type RGBAVector = [number, number, number, number]
export type HSVVector = [number, number, number]

export type CollectionStyle = v.InferOutput<typeof collectionStyleValidator>
export type GlobalModifierType =
  | 'exposure'
  | 'contrast'
  | 'frequency'
  | 'phase'
  | null
