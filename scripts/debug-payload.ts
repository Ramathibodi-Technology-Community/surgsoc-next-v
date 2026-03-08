import config from '../src/payload.config'

async function debug() {
  try {
    console.log("Loading config...")
    const c = await config
    console.log("Config loaded successfully!")
    console.log("Collections:", c.collections.map(col => col.slug))
  } catch (err) {
    console.error("Config load failed:", err)
  }
}

debug()
