import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { submitFeedbackRequest } from './actions'

export const dynamic = 'force-dynamic'

export default async function FeedbackPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    redirect('/login')
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Report Bug / Request Feature</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Send feedback to the admin team. Only admins can view submissions.
      </p>

      <form action={submitFeedbackRequest} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            defaultValue="feature"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="feature">Feature Request</option>
            <option value="bug">Bug Report</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={120}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            required
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Submit
        </button>
      </form>
    </section>
  )
}
