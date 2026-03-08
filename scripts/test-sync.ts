import { getPayloadInstance } from './shared.js'

async function runTest() {
  console.log('--- Starting hook test ---')
  const payload = await getPayloadInstance()

  // Find a user to test
  const users = await payload.find({
    collection: 'users',
    where: { email: { equals: 'member@test.com' } },
    limit: 1,
  })

  if (users.totalDocs === 0) {
    console.log('No member@test.com found')
    return
  }

  const user = users.docs[0]
  console.log(`Initial user roles: ${user.roles}`)
  console.log(`Initial user groups: ${user.groups?.map((g: any) => typeof g === 'object' ? g.slug : g)}`)

  // Update user to trigger hook
  console.log('\n--- Updating user: adding staff role & PR department ---')
  const updated = await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      roles: ['staff'],
      department: 'PR',
    }
  })

  console.log(`Updated user groups: ${updated.groups?.map((g: any) => typeof g === 'object' ? g.slug : g)}`)
  console.log('--- Done ---')
  process.exit(0)
}

runTest().catch((error) => {
  console.error(error)
  process.exit(1)
})
