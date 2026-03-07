export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method === "POST" && url.pathname === "/activate") {
      return handleActivate(request, env, corsHeaders)
    }

    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  },
}

async function handleActivate(request, env, corsHeaders) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })

  let body
  try {
    body = await request.json()
  } catch {
    return json({ status: "error", message: "invalid_json" }, 400)
  }

  const { license, device } = body

  if (!license || !/^GT-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(license)) {
    return json({ status: "error", message: "invalid_license" }, 400)
  }

  if (!device || typeof device !== "string" || device.length < 10) {
    return json({ status: "error", message: "invalid_device" }, 400)
  }

  const row = await env.DB.prepare(
    "SELECT id, license_key, used, device_id FROM licenses WHERE license_key = ?"
  )
    .bind(license)
    .first()

  if (!row) {
    return json({ status: "error", message: "invalid_license" }, 404)
  }

  if (row.used) {
    if (row.device_id === device) {
      return json({ status: "success", message: "already_activated_same_device" })
    }
    return json({ status: "error", message: "license_already_used" }, 409)
  }

  const now = new Date().toISOString()
  await env.DB.prepare(
    "UPDATE licenses SET used = 1, used_at = ?, device_id = ? WHERE id = ?"
  )
    .bind(now, device, row.id)
    .run()

  return json({ status: "success", message: "activated" })
}