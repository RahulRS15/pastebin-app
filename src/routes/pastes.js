const express = require("express")
const { v4: uuidv4 } = require("uuid")
const db = require("../db")
const { now } = require("../time")

const router = express.Router()

// CREATE PASTE
router.post("/", (req, res) => {
  const { content, ttl_seconds, max_views } = req.body

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "Invalid content" })
  }

  if (ttl_seconds !== undefined && (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)) {
    return res.status(400).json({ error: "Invalid ttl_seconds" })
  }

  if (max_views !== undefined && (!Number.isInteger(max_views) || max_views < 1)) {
    return res.status(400).json({ error: "Invalid max_views" })
  }

  const id = uuidv4()
  const createdAt = now()
  const expiresAt = ttl_seconds
    ? new Date(createdAt.getTime() + ttl_seconds * 1000)
    : null

  db.prepare(`
    INSERT INTO pastes (id, content, created_at, expires_at, max_views, views)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(
    id,
    content,
    createdAt.toISOString(),
    expiresAt?.toISOString() || null,
    max_views ?? null
  )

  res.status(201).json({
    id,
    url: `${req.protocol}://${req.get("host")}/p/${id}`
  })
})

// FETCH PASTE (API)
router.get("/:id", (req, res) => {
  const paste = db.prepare(
    "SELECT * FROM pastes WHERE id = ?"
  ).get(req.params.id)

  if (!paste) return res.status(404).json({ error: "Not found" })

  const currentTime = now()

  if (paste.expires_at && new Date(paste.expires_at) <= currentTime) {
    return res.status(404).json({ error: "Not found" })
  }

  if (paste.max_views !== null && paste.views >= paste.max_views) {
    return res.status(404).json({ error: "Not found" })
  }

  // Increment views AFTER checks
  db.prepare("UPDATE pastes SET views = views + 1 WHERE id = ?")
    .run(req.params.id)

  res.json({
    content: paste.content,
    remaining_views:
      paste.max_views === null ? null : paste.max_views - paste.views - 1,
    expires_at: paste.expires_at
  })
})

// VIEW PASTE (HTML)
function viewPaste(req, res) {
  const paste = db.prepare(
    "SELECT * FROM pastes WHERE id = ?"
  ).get(req.params.id)

  if (!paste) return res.status(404).send("Not Found")

  const currentTime = now()

  if (paste.expires_at && new Date(paste.expires_at) <= currentTime) {
    return res.status(404).send("Not Found")
  }

  if (paste.max_views !== null && paste.views >= paste.max_views) {
    return res.status(404).send("Not Found")
  }

  // Count view
  db.prepare("UPDATE pastes SET views = views + 1 WHERE id = ?")
    .run(req.params.id)

  res.status(200).send(`
    <!doctype html>
    <html>
      <body>
        <pre>${escapeHtml(paste.content)}</pre>
      </body>
    </html>
  `)
}

// Prevent XSS
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  )
}

module.exports = router
module.exports.viewPaste = viewPaste
