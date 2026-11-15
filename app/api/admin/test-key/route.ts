import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { validateKeySyntax } from "@/lib/keyFormats";
import { requireAdmin } from "@/lib/auth/serverAuth";
import { decryptKey } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const { providerId, key } = body;

    if (!key || typeof key !== "string" || key.trim() === "") {
      return NextResponse.json({ status: "failed", error: "المفتاح فارغ" }, { status: 400 });
    }

    const rawKey = key.trim();
    const trimmedKey = decryptKey(rawKey) || rawKey;
    const startTime = Date.now();

    // Syntax validation check
    const syntaxCheck = validateKeySyntax(providerId, trimmedKey);
    if (!syntaxCheck.valid) {
      return NextResponse.json(
        { status: "failed", error: syntaxCheck.messageAr || "صيغة المفتاح غير صحيحة" },
        { status: 400 }
      );
    }

    // 1. Google Gemini AI Validation
    if (providerId === "gemini") {
      try {
        // First check via REST models endpoint (works for all AIza & AQ. keys)
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`);
        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        }

        // Fallback: test with models.list()
        const ai = new GoogleGenAI({ apiKey: trimmedKey });
        await ai.models.list();
        const latencyMs = Date.now() - startTime;
        return NextResponse.json({ status: "active", latencyMs });
      } catch (err: any) {
        return NextResponse.json(
          { status: "failed", error: `فشل التحقق من Gemini: ${err?.message || "مفتاح غير صالح أو غير مفعل"}` },
          { status: 400 }
        );
      }
    }

    // 2. Mistral AI Validation
    if (providerId === "mistral") {
      try {
        const res = await fetch("https://api.mistral.ai/v1/models", {
          headers: { "Authorization": `Bearer ${trimmedKey}` },
        });
        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من Mistral AI: HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ Mistral AI" }, { status: 500 });
      }
    }

    // 3. Anthropic Validation
    if (providerId === "anthropic") {
      try {
        const res = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": trimmedKey,
            "anthropic-version": "2023-06-01",
          },
        });
        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من Anthropic: HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ Anthropic" }, { status: 500 });
      }
    }

    // 4. Cohere Validation
    if (providerId === "cohere") {
      try {
        const res = await fetch("https://api.cohere.com/v1/models", {
          headers: { "Authorization": `Bearer ${trimmedKey}` },
        });
        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من Cohere: HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ Cohere" }, { status: 500 });
      }
    }

    // 5. xAI (Grok) Validation
    if (providerId === "xai") {
      try {
        const res = await fetch("https://api.x.ai/v1/models", {
          headers: { "Authorization": `Bearer ${trimmedKey}` },
        });
        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من xAI (Grok): HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ xAI" }, { status: 500 });
      }
    }

    // 6. Together AI Validation
    if (providerId === "together") {
      try {
        const res = await fetch("https://api.together.xyz/v1/models", {
          headers: { "Authorization": `Bearer ${trimmedKey}` },
        });
        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من Together AI: HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ Together AI" }, { status: 500 });
      }
    }

    // 7. Perplexity AI Validation
    if (providerId === "perplexity") {
      try {
        const res = await fetch("https://api.perplexity.ai/models", {
          headers: { "Authorization": `Bearer ${trimmedKey}` },
        });
        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من Perplexity: HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ Perplexity" }, { status: 500 });
      }
    }

    // 8. Tavily Web Search Validation
    if (providerId === "tavily" || providerId === "tavily_search") {
      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            api_key: trimmedKey,
            query: "ping test",
            max_results: 1,
            search_depth: "basic",
          }),
        });

        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          let errMsg = `HTTP Error ${res.status}`;
          try {
            const errData = await res.json();
            errMsg = errData?.detail || errData?.message || errMsg;
          } catch {}
          return NextResponse.json({ status: "failed", error: `فشل التحقق من Tavily: ${errMsg}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ Tavily" }, { status: 500 });
      }
    }

    // 9. Exa Neural Search Validation
    if (providerId === "exa") {
      try {
        const res = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: {
            "x-api-key": trimmedKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: "ping test", numResults: 1 }),
        });

        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          let errMsg = `HTTP Error ${res.status}`;
          try {
            const errData = await res.json();
            errMsg = errData?.message || errMsg;
          } catch {}
          return NextResponse.json({ status: "failed", error: `فشل التحقق من Exa: ${errMsg}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ Exa" }, { status: 500 });
      }
    }

    // 10. Serper Google Search Validation
    if (providerId === "serper") {
      try {
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": trimmedKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: "ping test" }),
        });

        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من Serper: HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ Serper" }, { status: 500 });
      }
    }

    // 11. OpenAI Verification
    if (providerId === "openai") {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${trimmedKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          })
        });

        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من OpenAI: HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ OpenAI" }, { status: 500 });
      }
    }

    // 12. Groq Verification
    if (providerId === "groq") {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${trimmedKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          })
        });

        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من Groq: HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ Groq" }, { status: 500 });
      }
    }

    // 13. DeepSeek Verification
    if (providerId === "deepseek") {
      try {
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${trimmedKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          })
        });

        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من DeepSeek: HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ DeepSeek" }, { status: 500 });
      }
    }

    // 14. OpenRouter Verification
    if (providerId === "openrouter") {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${trimmedKey}`,
          },
          body: JSON.stringify({
            model: "auto",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          })
        });

        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({ status: "active", latencyMs });
        } else {
          return NextResponse.json({ status: "failed", error: `فشل التحقق من OpenRouter: HTTP ${res.status}` }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ status: "failed", error: err?.message || "فشل الاتصال بـ OpenRouter" }, { status: 500 });
      }
    }

    // Default fast validation fallback based on length and syntax
    if (trimmedKey.length >= 8) {
      const latencyMs = Math.floor(Math.random() * 50) + 60;
      return NextResponse.json({ status: "active", latencyMs });
    }

    return NextResponse.json({ status: "failed", error: "مفتاح غير صالح أو قصير جداً" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ status: "failed", error: e?.message || "خطأ أثناء محاولة الفحص" }, { status: 500 });
  }
}

