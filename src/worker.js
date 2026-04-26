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

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCompanySize = escapeHtml(companySize);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

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
      ].join("\n"),
      html: `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7fbfb;font-family:Manrope,Segoe UI,sans-serif;color:#142426;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f7fbfb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="max-width:640px;background:#ffffff;border-radius:18px;border:1px solid rgba(20,36,38,0.08);">
            <tr>
              <td style="padding:28px 32px 12px;">
                <h1 style="margin:0 0 6px;font-size:22px;">New contact request</h1>
                <p style="margin:0;color:#4a5b5e;font-size:14px;">Reecog website contact form</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 18px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #e6f0f1;font-weight:600;width:160px;">Name</td>
                    <td style="padding:12px 0;border-bottom:1px solid #e6f0f1;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #e6f0f1;font-weight:600;">Email</td>
                    <td style="padding:12px 0;border-bottom:1px solid #e6f0f1;">${safeEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #e6f0f1;font-weight:600;">Company size</td>
                    <td style="padding:12px 0;border-bottom:1px solid #e6f0f1;">${safeCompanySize}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;">
                <h2 style="margin:0 0 10px;font-size:16px;">Message</h2>
                <div style="background:#f7fbfb;border-radius:12px;padding:16px;border:1px solid #e6f0f1;line-height:1.5;">
                  ${safeMessage}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
