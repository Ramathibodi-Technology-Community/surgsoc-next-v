import { Payload } from 'payload'

export const FormBlockingService = {
  /**
   * identifying blocking forms for a user.
   * Returns a list of incomplete form assignments that block registration.
   */
  async getBlockingForms(payload: Payload, userId: string | number) {
    if (!userId) return []

    const assignments = await payload.find({
      collection: 'form-assignments',
      where: {
        and: [
          { user: { equals: userId } },
//          { completed: { not_equals: true } }, // 'completed' is checkbox, false or null
          { completed: { equals: false } },
          { blocks_registration: { equals: true } },
        ],
      },
      depth: 1, // To get form title
    })

    return assignments.docs
  },

  /**
   * Checks if a user is blocked from registering.
   */
  async isUserBlocked(payload: Payload, userId: string | number) {
    const blockingForms = await this.getBlockingForms(payload, userId)
    return blockingForms.length > 0
  },
}
