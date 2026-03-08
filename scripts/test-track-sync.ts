import { getPayloadInstance } from './shared.js'

async function runTest() {
  const payload = await getPayloadInstance()
  const users = await payload.find({
    collection: 'users',
    where: { email: { equals: 'member@test.com' } },
    limit: 1,
  })

  const user = users.docs[0]
  console.log(`Initial track: ${user.academic?.track}`)
  console.log(`Initial groups: ${user.groups?.map((g: any) => typeof g === 'object' ? g.slug : g)}`)

  const updated = await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      academic: {
        ...user.academic,
        track: 'MD',
      }
    }
  })

  console.log(`Updated track: ${updated.academic?.track}`)
  console.log(`Updated groups: ${updated.groups?.map((g: any) => typeof g === 'object' ? g.slug : g)}`)

  process.exit(0)
}

runTest().catch((error) => {
  console.error(error)
  process.exit(1)
})
