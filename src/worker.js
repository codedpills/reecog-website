export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return jsonResponse({ ok: true }, 200);
    }

    if (request.method === "POST" && url.pathname === "/api/contact") {
      return handleContact(request, env);
    }

    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);

      if (assetResponse.status !== 404) {
        return assetResponse;
      }

      if (request.method === "GET" && acceptsHtml(request)) {
        const indexUrl = new URL(request.url);
        indexUrl.pathname = "/index.html";
        return env.ASSETS.fetch(indexUrl.toString());
      }
    }

    return new Response("Not found", { status: 404 });
  }
};

async function handleContact(request, env) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const formData = contentType.includes("application/json")
      ? toFormDataFromJson(await request.json())
      : await request.formData();

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const companySize = String(formData.get("companySize") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !companySize || !message) {
      return jsonResponse({ error: "Missing required fields." }, 400);
    }

    const resendApiKey = env.RESEND_API_KEY;
    const toEmail = env.CONTACT_TO;
    const fromEmail = env.CONTACT_FROM || "Reecog <no-reply@reecog.com>";

    if (!resendApiKey || !toEmail) {
      return jsonResponse({ error: "Server not configured." }, 500);
    }

    const payload = {
      from: fromEmail,
      to: [toEmail],
      subject: `Reecog contact form: ${name}`,
      reply_to: email,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company size: ${companySize}`,
        "",
        message
      ].join("\n")
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return jsonResponse({ error: "Email send failed." }, 502);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    return jsonResponse({ error: "Unexpected error." }, 500);
  }
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function acceptsHtml(request) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function toFormDataFromJson(data) {
  const formData = new FormData();

  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      formData.set(key, String(value ?? ""));
    }
  }

  return formData;
}
