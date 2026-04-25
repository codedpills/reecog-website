export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const companySize = String(formData.get("companySize") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !companySize || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const resendApiKey = env.RESEND_API_KEY;
    const toEmail = env.CONTACT_TO;
    const fromEmail = env.CONTACT_FROM || "Reecog <no-reply@reecog.com>";

    if (!resendApiKey || !toEmail) {
      return new Response(JSON.stringify({ error: "Server not configured." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
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
      return new Response(JSON.stringify({ error: "Email send failed." }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unexpected error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
