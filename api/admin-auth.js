export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { password } = req.body ?? {}
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminToken = process.env.ADMIN_TOKEN

  if (!adminPassword || !adminToken) {
    return res.status(500).json({ error: 'Server not configured — set ADMIN_PASSWORD and ADMIN_TOKEN env vars' })
  }
  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  res.setHeader(
    'Set-Cookie',
    `phx_admin_token=${adminToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`,
  )
  res.status(200).json({ ok: true })
}
