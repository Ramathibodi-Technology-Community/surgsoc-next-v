#!/usr/bin/env node
// @ts-nocheck
import { getPayloadInstance } from './shared.js'

async function fixLexical() {
  const payload = await getPayloadInstance()
  console.log('Fixing Lexical rich text fields in Forms...')
  const forms = await payload.find({
    collection: 'forms',
    limit: 100,
  })

  for (const form of forms.docs) {
    let needsUpdate = false
    const msg = form.confirmationMessage
    if (msg?.root?.children) {
      for (const child of msg.root.children) {
        if (child.type === 'paragraph' && child.children) {
          for (const leaf of child.children) {
            if (!leaf.type && leaf.text) {
              leaf.type = 'text'
              leaf.version = 1
              needsUpdate = true
            }
          }
        }
      }
    }

    if (needsUpdate) {
      await payload.update({
        collection: 'forms',
        id: form.id,
        data: {
          confirmationMessage: msg
        }
      })
      console.log(`Updated form ${form.id} - ${form.title}`)
    }
  }
}

fixLexical()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
