const express = require("express")
const db = require("../db")

const router = express.Router()

router.get("/", (req, res) => {
  try {
    db.prepare("SELECT 1").get()
    res.status(200).json({ ok: true })
  } catch {
    res.status(200).json({ ok: false })
  }
})

module.exports = router
