// GPS Docente Premium — Edge Function: kiwify-webhook
// Recebe eventos da Kiwify e ativa/cancela acesso premium em public.subscriptions.
// Arquitetura: Kiwify → Supabase Edge Function → Supabase Auth + public.subscriptions
//
// URL de configuração na Kiwify:
// https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/kiwify-webhook?token=<KIWIFY_WEBHOOK_TOKEN>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// CORS
// ============================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================================
// UTILITÁRIOS — MASCARAMENTO DE DADOS SENSÍVEIS
// ============================================================

/** Mascara e-mail para logs: g***@dominio.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked = local.length <= 2
    ? local[0] + "***"
    : local[0] + "***" + local[local.length - 1];
  return `${masked}@${domain}`;
}

/** Retorna apenas os primeiros 8 caracteres do UUID para logs */
function maskUserId(id: string): string {
  return id.substring(0, 8) + "...";
}

// ============================================================
// EXTRAÇÃO ROBUSTA DE E-MAIL
// Tenta múltiplos campos do payload Kiwify (diferentes versões da API)
// ============================================================
function extractEmail(payload: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    (payload.Customer as Record<string, unknown>)?.email,
    (payload.customer as Record<string, unknown>)?.email,
    payload.customer_email,
    (payload.buyer as Record<string, unknown>)?.email,
    (payload.client as Record<string, unknown>)?.email,
    ((payload.data as Record<string, unknown>)?.customer as Record<string, unknown>)?.email,
    ((payload.data as Record<string, unknown>)?.Customer as Record<string, unknown>)?.email,
    ((payload.data as Record<string, unknown>)?.buyer as Record<string, unknown>)?.email,
    payload.email,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate.trim().toLowerCase();
    }
  }
  return null;
}

// ============================================================
// EXTRAÇÃO ROBUSTA DO TIPO DE EVENTO
// Tenta múltiplos campos do payload Kiwify
// ============================================================
function extractEventType(payload: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    payload.webhook_event_type,
    payload.event,
    payload.event_type,
    payload.type,
    (payload.data as Record<string, unknown>)?.webhook_event_type,
    (payload.data as Record<string, unknown>)?.event,
    (payload.data as Record<string, unknown>)?.event_type,
    payload.order_status,
    payload.status,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate.trim().toLowerCase();
    }
  }
  return null;
}

// ============================================================
// EXTRAÇÃO DE EXTERNAL_ID (ID da transação/pedido/assinatura)
// ============================================================
function extractExternalId(payload: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    payload.id,
    payload.order_id,
    payload.transaction_id,
    payload.purchase_id,
    payload.subscription_id,
    (payload.data as Record<string, unknown>)?.id,
    (payload.data as Record<string, unknown>)?.order_id,
    (payload.data as Record<string, unknown>)?.transaction_id,
    (payload.data as Record<string, unknown>)?.purchase_id,
    (payload.data as Record<string, unknown>)?.subscription_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate.trim();
    }
  }
  return null;
}

// ============================================================
// CLASSIFICAÇÃO DO EVENTO
// ============================================================
type EventAction = "activate" | "cancel" | "ignore";

function classifyEvent(eventType: string): EventAction {
  const activateEvents = [
    "order_approved",
    "purchase_approved",
    "compra_aprovada",
    "compra aprovada",
    "approved",
    "paid",
    "subscription_renewed",
    "assinatura_renovada",
    "assinatura renovada",
  ];

  const cancelEvents = [
    "subscription_canceled",
    "subscription_cancelled",
    "assinatura_cancelada",
    "assinatura cancelada",
    "canceled",
    "cancelled",
    "order_refunded",
    "refunded",
    "reembolso",
    "chargeback",
    "assinatura_atrasada",
    "subscription_late",
    "overdue",
  ];

  const normalized = eventType.toLowerCase().trim();

  if (activateEvents.includes(normalized)) return "activate";
  if (cancelEvents.includes(normalized)) return "cancel";
  return "ignore";
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  // Apenas POST permitido
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "method_not_allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  console.log("[kiwify-webhook] Webhook received");

  try {
    // ── 1. VALIDAÇÃO DO TOKEN ──────────────────────────────────
    // A Kiwify envia o token como query param: ?token=<KIWIFY_WEBHOOK_TOKEN>
    const url = new URL(req.url);
    const receivedToken = url.searchParams.get("token") ?? req.headers.get("x-kiwify-token");
    const expectedToken = Deno.env.get("KIWIFY_WEBHOOK_TOKEN");

    if (!receivedToken || !expectedToken || receivedToken !== expectedToken) {
      console.warn("[kiwify-webhook] Invalid or missing token");
      return new Response(
        JSON.stringify({ ok: false, error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. PARSE DO PAYLOAD ────────────────────────────────────
    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      console.warn("[kiwify-webhook] Invalid JSON body");
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_json" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 3. EXTRAÇÃO DO E-MAIL ──────────────────────────────────
    const email = extractEmail(payload);
    if (!email) {
      console.log("[kiwify-webhook] No email found in payload — ignoring");
      return new Response(
        JSON.stringify({ ok: true, ignored: true, reason: "missing_email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log(`[kiwify-webhook] Email: ${maskEmail(email)}`);

    // ── 4. EXTRAÇÃO DO TIPO DE EVENTO ──────────────────────────
    const eventType = extractEventType(payload);
    if (!eventType) {
      console.log("[kiwify-webhook] No event type found — ignoring");
      return new Response(
        JSON.stringify({ ok: true, ignored: true, reason: "missing_event_type" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log(`[kiwify-webhook] Event type: ${eventType}`);

    // ── 5. CLASSIFICAÇÃO DO EVENTO ─────────────────────────────
    const action = classifyEvent(eventType);
    if (action === "ignore") {
      console.log(`[kiwify-webhook] Unsupported event: ${eventType} — ignoring`);
      return new Response(
        JSON.stringify({ ok: true, ignored: true, reason: "unsupported_event", eventType }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log(`[kiwify-webhook] Action: ${action}`);

    // ── 6. CLIENTE SUPABASE COM SERVICE ROLE ──────────────────
    // Necessário para operações server-to-server sem sessão de usuário
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── 7. BUSCAR OU CRIAR USUÁRIO ─────────────────────────────
    // Buscar usuário existente pelo e-mail
    const { data: userListData, error: userListError } = await supabaseAdmin.auth.admin.listUsers();

    let userId: string | null = null;

    if (!userListError && userListData?.users) {
      const existingUser = userListData.users.find(
        (u) => u.email?.toLowerCase() === email,
      );
      if (existingUser) {
        userId = existingUser.id;
        console.log(`[kiwify-webhook] Existing user found: ${maskUserId(userId)}`);
      }
    }

    // Se não encontrou, criar novo usuário
    if (!userId) {
      console.log(`[kiwify-webhook] User not found — creating account for ${maskEmail(email)}`);
      const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          source: "kiwify",
          created_by_webhook: true,
        },
      });

      if (createError || !newUserData?.user) {
        console.error("[kiwify-webhook] Failed to create user:", createError?.message);
        return new Response(
          JSON.stringify({ ok: false, error: "internal_error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      userId = newUserData.user.id;
      console.log(`[kiwify-webhook] New user created: ${maskUserId(userId)}`);
    }

    // ── 8. EXTRAÇÃO DO EXTERNAL_ID ─────────────────────────────
    const externalId = extractExternalId(payload);

    // ── 9. UPSERT EM PUBLIC.SUBSCRIPTIONS ─────────────────────
    // Verificar se já existe registro para o usuário
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 dias

    if (action === "activate") {
      const subscriptionData = {
        plan: "premium",
        status: "active",
        provider: "kiwify",
        external_id: externalId ?? null,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      };

      if (existingSub) {
        // Atualizar registro existente
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update(subscriptionData)
          .eq("user_id", userId);

        if (updateError) {
          console.error("[kiwify-webhook] Failed to update subscription:", updateError.message);
          return new Response(
            JSON.stringify({ ok: false, error: "internal_error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } else {
        // Inserir novo registro
        const { error: insertError } = await supabaseAdmin
          .from("subscriptions")
          .insert({ user_id: userId, ...subscriptionData });

        if (insertError) {
          console.error("[kiwify-webhook] Failed to insert subscription:", insertError.message);
          return new Response(
            JSON.stringify({ ok: false, error: "internal_error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      console.log(`[kiwify-webhook] Premium activated for user ${maskUserId(userId)}`);
      return new Response(
        JSON.stringify({ ok: true, action: "activated", email: maskEmail(email) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // action === "cancel"
    const cancelData = {
      plan: "free",
      status: "canceled",
      updated_at: now.toISOString(),
    };

    if (existingSub) {
      const { error: cancelError } = await supabaseAdmin
        .from("subscriptions")
        .update(cancelData)
        .eq("user_id", userId);

      if (cancelError) {
        console.error("[kiwify-webhook] Failed to cancel subscription:", cancelError.message);
        return new Response(
          JSON.stringify({ ok: false, error: "internal_error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      // Não há registro — inserir como free/canceled para consistência
      const { error: insertCancelError } = await supabaseAdmin
        .from("subscriptions")
        .insert({ user_id: userId, ...cancelData, started_at: now.toISOString() });

      if (insertCancelError) {
        console.error("[kiwify-webhook] Failed to insert canceled subscription:", insertCancelError.message);
        // Não crítico — retornar sucesso pois o usuário não tem acesso de qualquer forma
      }
    }

    console.log(`[kiwify-webhook] Premium canceled for user ${maskUserId(userId)}`);
    return new Response(
      JSON.stringify({ ok: true, action: "canceled", email: maskEmail(email) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("[kiwify-webhook] Unexpected error:", (err as Error).message);
    return new Response(
      JSON.stringify({ ok: false, error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
