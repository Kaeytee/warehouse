import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Vanguard Cargo <noreply@vanguardcargo.co>";
const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") || "support@vanguardcargo.co";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer, x-requested-with"
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const body = await req.json();
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Validate required fields
    if (!body.adminId || !body.targetUserId || !body.reason) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields (adminId, targetUserId, reason)"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Fetch admin (warehouse_admin) user data
    const { data: admin, error: adminError } = await supabase
      .from("users")
      .select("*")
      .eq("id", body.adminId)
      .single();

    if (adminError || !admin) {
      console.error("Admin fetch error:", adminError);
      throw new Error("Unable to fetch admin data");
    }

    // Fetch target user data
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", body.targetUserId)
      .single();

    if (targetUserError || !targetUser) {
      console.error("Target user fetch error:", targetUserError);
      throw new Error("Unable to fetch target user data");
    }

    const adminName = `${admin.first_name || ""} ${admin.last_name || ""}`.trim() || "Unknown Admin";
    const adminEmail = admin.email || "Unknown Email";
    const adminRole = admin.role || "warehouse_admin";
    const adminSuite = admin.suite_number || "N/A";

    const targetUserName = `${targetUser.first_name || ""} ${targetUser.last_name || ""}`.trim() || "Unknown User";
    const targetUserEmail = targetUser.email || "Unknown Email";
    const targetUserSuite = targetUser.suite_number || "N/A";
    const targetUserRole = targetUser.role || "client";

    const reason = body.reason || "No reason provided";
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "full",
      timeStyle: "long"
    });

    // ---------- EMAIL HTML TEMPLATE ----------
    const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>User Deactivation Request</title>
        <style>
          body {
            background-color: #f7f7f7;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 650px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
            text-align: center;
            padding: 40px 20px;
          }
          .header img {
            display: block;
            margin: 0 auto 15px;
            width: 160px;
            height: auto;
            filter: brightness(0) invert(1);
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            color: #ffffff;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.8;
          }
          .content p {
            margin: 15px 0;
            font-size: 16px;
          }
          .alert-box {
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .alert-box h3 {
            margin: 0 0 10px 0;
            color: #e65100;
            font-size: 18px;
          }
          .info-card {
            background: #f8f9fa;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
          }
          .info-card h3 {
            margin: 0 0 15px 0;
            color: #d32f2f;
            font-size: 18px;
            font-weight: 600;
            border-bottom: 2px solid #d32f2f;
            padding-bottom: 10px;
          }
          .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #555;
            min-width: 140px;
          }
          .info-value {
            color: #333;
            flex: 1;
          }
          .reason-box {
            background: #ffebee;
            border: 2px solid #ef5350;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .reason-box h3 {
            margin: 0 0 10px 0;
            color: #c62828;
            font-size: 18px;
          }
          .reason-text {
            background: #ffffff;
            padding: 15px;
            border-radius: 6px;
            font-size: 15px;
            line-height: 1.6;
            border-left: 4px solid #d32f2f;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 13px;
            color: #777;
            background-color: #f2f2f2;
          }
          .footer a {
            color: #d32f2f;
            text-decoration: none;
          }
          .timestamp {
            text-align: center;
            font-size: 13px;
            color: #999;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <img src="https://www.vanguardcargo.co/favicon.ico" alt="Vanguard Cargo Logo" />
            <h1>🚨 User Deactivation Request</h1>
          </div>

          <!-- Body -->
          <div class="content">
            <div class="alert-box">
              <h3>⚠️ Action Required</h3>
              <p style="margin: 0;">A warehouse administrator has requested to deactivate a user account. Please review the details below and take appropriate action.</p>
            </div>

            <!-- Admin Details -->
            <div class="info-card">
              <h3>👤 Requesting Administrator</h3>
              <div class="info-row">
                <div class="info-label">Name:</div>
                <div class="info-value">${adminName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">${adminEmail}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Role:</div>
                <div class="info-value">${adminRole}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Suite Number:</div>
                <div class="info-value">${adminSuite}</div>
              </div>
            </div>

            <!-- Target User Details -->
            <div class="info-card">
              <h3>🎯 Target User to Deactivate</h3>
              <div class="info-row">
                <div class="info-label">Name:</div>
                <div class="info-value">${targetUserName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">${targetUserEmail}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Suite Number:</div>
                <div class="info-value">${targetUserSuite}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Role:</div>
                <div class="info-value">${targetUserRole}</div>
              </div>
            </div>

            <!-- Reason for Deactivation -->
            <div class="reason-box">
              <h3>📝 Reason for Deactivation</h3>
              <div class="reason-text">${reason}</div>
            </div>

            <p style="margin-top: 30px; font-size: 15px;">
              <strong>Next Steps:</strong><br/>
              Please review this request and either approve or deny the user deactivation. 
              Contact the requesting administrator if additional information is needed.
            </p>

            <div class="timestamp">
              Request submitted on: ${timestamp}
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>This is an automated notification from the Vanguard Cargo Warehouse Management System</p>
            <p>&copy; ${new Date().getFullYear()} <a href="https://www.vanguardcargo.co">Vanguard Cargo</a> | All rights reserved</p>
          </div>
        </div>
      </body>
    </html>`;

    // Send email to support with CC to Joshua
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [SUPPORT_EMAIL],
      cc: ['joshua@vanguardcargo.co'],
      subject: `🚨 User Deactivation Request from ${adminName}`,
      html: emailTemplate,
      replyTo: adminEmail
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Support notification sent successfully"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({
        error: (err as Error)?.message || "Failed to send support notification"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
