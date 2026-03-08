import { getPayloadInstance } from './shared.js'

async function migrateUsers() {
  console.log('--- Starting Track & Roles Group Backfill Migration ---')
  const payload = await getPayloadInstance()

  // Find all users
  const users = await payload.find({
    collection: 'users',
    limit: 1000,
    depth: 0
  })

  console.log(`Found ${users.totalDocs} users to process.`)

  let updatedCount = 0

  for (const user of users.docs) {
    try {
      // By sending an empty update, Payload will trigger the beforeChange hooks.
      // Our syncUserGroups hook merges current data with `originalDoc` and re-calculates the groups.
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {},
        // We explicitly DO NOT skip group sync here!
      })
      console.log(`✅ User updated: ${user.email}`)
      updatedCount++
    } catch (err: any) {
      console.error(`❌ Failed to update user ${user.email}: ${err.message}`)
    }
  }

  console.log(`\n--- Migration Complete ---`)
  console.log(`Successfully processed ${updatedCount}/${users.totalDocs} users.`)
  process.exit(0)
}

migrateUsers().catch((error) => {
  console.error(error)
  process.exit(1)
})
