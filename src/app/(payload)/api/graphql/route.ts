/* eslint-disable import/no-unresolved */
import config from '@payload-config'
import { GRAPHQL_POST, GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'
/* eslint-enable import/no-unresolved */

export const POST = GRAPHQL_POST(config)
export const GET = GRAPHQL_PLAYGROUND_GET(config)
