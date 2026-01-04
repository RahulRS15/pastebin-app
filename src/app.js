require("dotenv").config()
const express = require("express")
const health = require("./routes/health")
const pastes = require("./routes/pastes")

const app = express()

app.use(express.json())

app.use("/api/healthz", health)
app.use("/api/pastes", pastes)

// HTML view route
app.get("/p/:id", require("./routes/pastes").viewPaste)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
