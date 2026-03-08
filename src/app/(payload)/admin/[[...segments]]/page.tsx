/* eslint-disable import/no-unresolved */
import config from '@payload-config'
import { RootPage } from '@payloadcms/next/views'
import { importMap } from './importMap'
/* eslint-enable import/no-unresolved */

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

const Page = ({ params, searchParams }: Args) => (
  <RootPage config={config} params={params} searchParams={searchParams} importMap={importMap} />
)

export default Page
