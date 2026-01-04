function now() {
  if (process.env.TEST_MODE === "1") {
    return new Date(
      process.env.TEST_NOW || "2026-01-01T00:00:00.000Z"
    )
  }
  return new Date()
}

module.exports = { now }
