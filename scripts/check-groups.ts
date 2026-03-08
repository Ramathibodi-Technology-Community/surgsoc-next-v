import { getPayloadInstance } from './shared.js'

async function runTest() {
  const payload = await getPayloadInstance()
  const groups = await payload.find({
    collection: 'groups',
    limit: 100,
  })

  console.log(`Groups in DB: ${groups.docs.map(g => `${g.slug} (${g.type})`).join(', ')}`)

  process.exit(0)
}

runTest().catch((error) => {
  console.error(error)
  process.exit(1)
})
