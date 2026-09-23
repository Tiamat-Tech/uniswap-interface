// Re-export shim: TestID now lives in `@universe/test` so packages below
// `uniswap` in the dependency graph (e.g. mycelium) can reach it. Kept until
// the call sites are migrated to import from `@universe/test` (INFRA-4057).
export { TestID } from '@universe/test'
export type { TestIDIterableType, TestIDType, TestIDwithSufixType } from '@universe/test'
