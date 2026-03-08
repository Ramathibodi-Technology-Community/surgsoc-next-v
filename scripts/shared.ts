#!/usr/bin/env node

/**
 * Shared utilities for database scripts.
 * Provides a cached Payload instance for seed/reset scripts.
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const _filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)

// Load .env from project root
dotenv.config({ path: path.resolve(_dirname, '../.env') })

/**
 * Project root directory (one level up from scripts/).
 */
export const projectRoot = path.resolve(_dirname, '..')

/**
 * Returns a connected Payload instance.
 * Uses dynamic import to avoid bundling issues with tsx.
 */
export async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  return getPayload({ config })
}
