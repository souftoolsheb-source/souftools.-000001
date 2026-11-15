import { NextRequest, NextResponse } from "next/server";
import { updateLoadedToolsStats } from "@/lib/toolsConfig";
import { requireAdmin } from "@/lib/auth/serverAuth";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const { toolId, key } = body;

    if (!key || key.trim() === "") {
      return NextResponse.json({ valid: false, message: "المفتاح فارغ" });
    }

    const trimmedKey = key.trim();

    // 1. TAVILY VERIFICATION
    if (toolId === "tavily") {
      const startTime = Date.now();
      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${trimmedKey}`
          },
          body: JSON.stringify({
            api_key: trimmedKey,
            query: "ping test key",
            max_results: 1,
            search_depth: "basic",
          }),
        });

        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          updateLoadedToolsStats("tavily", "success", "فحص واختبار المفتاح البرمجي", latencyMs);
          return NextResponse.json({
            valid: true,
            message: `نشط (الاستجابة: ${latencyMs}ms)`,
          });
        } else {
          updateLoadedToolsStats("tavily", "failed", "فحص واختبار المفتاح البرمجي", latencyMs);
          let errMsg = `خطأ HTTP ${res.status}`;
          try {
            const errData = await res.json();
            errMsg = errData?.detail || errData?.message || errMsg;
          } catch {}
          return NextResponse.json({
            valid: false,
            message: `فشل الفحص: ${errMsg}`,
          });
        }
      } catch (err: any) {
        updateLoadedToolsStats("tavily", "failed", "فحص واختبار المفتاح البرمجي", Date.now() - startTime);
        return NextResponse.json({
          valid: false,
          message: `فشل الاتصال بـ Tavily: ${err?.message || "خطأ غير معروف"}`,
        });
      }
    }

    // 2. EXA NEURAL SEARCH VERIFICATION
    if (toolId === "exa") {
      const startTime = Date.now();
      try {
        const res = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": trimmedKey,
          },
          body: JSON.stringify({
            query: "ping test key",
            numResults: 1,
          }),
        });

        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          updateLoadedToolsStats("exa", "success", "فحص واختبار المفتاح البرمجي", latencyMs);
          return NextResponse.json({
            valid: true,
            message: `نشط (الاستجابة: ${latencyMs}ms)`,
          });
        } else {
          updateLoadedToolsStats("exa", "failed", "فحص واختبار المفتاح البرمجي", latencyMs);
          let errMsg = `خطأ HTTP ${res.status}`;
          try {
            const errData = await res.json();
            errMsg = errData?.error || errMsg;
          } catch {}
          return NextResponse.json({
            valid: false,
            message: `فشل الفحص: ${errMsg}`,
          });
        }
      } catch (err: any) {
        updateLoadedToolsStats("exa", "failed", "فحص واختبار المفتاح البرمجي", Date.now() - startTime);
        return NextResponse.json({
          valid: false,
          message: `فشل الاتصال بـ Exa: ${err?.message || "خطأ غير معروف"}`,
        });
      }
    }

    // 3. JINA READER VERIFICATION
    if (toolId === "jina") {
      const startTime = Date.now();
      try {
        const res = await fetch("https://r.jina.ai/https://example.com", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${trimmedKey}`,
            "X-No-Cache": "true",
          },
        });

        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          updateLoadedToolsStats("jina", "success", "فحص واختبار المفتاح البرمجي", latencyMs);
          return NextResponse.json({
            valid: true,
            message: `نشط (الاستجابة: ${latencyMs}ms)`,
          });
        } else {
          updateLoadedToolsStats("jina", "failed", "فحص واختبار المفتاح البرمجي", latencyMs);
          return NextResponse.json({
            valid: false,
            message: `فشل الفحص: خطأ HTTP ${res.status}`,
          });
        }
      } catch (err: any) {
        updateLoadedToolsStats("jina", "failed", "فحص واختبار المفتاح البرمجي", Date.now() - startTime);
        return NextResponse.json({
          valid: false,
          message: `فشل الاتصال بـ Jina: ${err?.message || "خطأ غير معروف"}`,
        });
      }
    }

    // 4. FIRECRAWL VERIFICATION
    if (toolId === "firecrawl") {
      const startTime = Date.now();
      try {
        const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${trimmedKey}`,
          },
          body: JSON.stringify({
            url: "https://example.com",
            formats: ["markdown"],
          }),
        });
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          updateLoadedToolsStats("firecrawl", "success", "فحص واختبار المفتاح البرمجي", latencyMs);
          return NextResponse.json({
            valid: true,
            message: `نشط (الاستجابة: ${latencyMs}ms)`,
          });
        } else {
          updateLoadedToolsStats("firecrawl", "failed", "فحص واختبار المفتاح البرمجي", latencyMs);
          return NextResponse.json({
            valid: false,
            message: `فشل الفحص: خطأ HTTP ${res.status}`,
          });
        }
      } catch (err: any) {
        updateLoadedToolsStats("firecrawl", "failed", "فحص واختبار المفتاح البرمجي", Date.now() - startTime);
        return NextResponse.json({
          valid: false,
          message: `فشل الاتصال بـ Firecrawl: ${err?.message || "خطأ غير معروف"}`,
        });
      }
    }

    // 5. SERPER VERIFICATION
    if (toolId === "serper") {
      const startTime = Date.now();
      try {
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": trimmedKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: "ping test" }),
        });
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          updateLoadedToolsStats("serper", "success", "فحص واختبار المفتاح البرمجي", latencyMs);
          return NextResponse.json({
            valid: true,
            message: `نشط (الاستجابة: ${latencyMs}ms)`,
          });
        } else {
          updateLoadedToolsStats("serper", "failed", "فحص واختبار المفتاح البرمجي", latencyMs);
          return NextResponse.json({
            valid: false,
            message: `فشل الفحص: خطأ HTTP ${res.status}`,
          });
        }
      } catch (err: any) {
        updateLoadedToolsStats("serper", "failed", "فحص واختبار المفتاح البرمجي", Date.now() - startTime);
        return NextResponse.json({
          valid: false,
          message: `فشل الاتصال بـ Serper: ${err?.message || "خطأ غير معروف"}`,
        });
      }
    }

    // 6. GENERAL BASIC LENGTH VALIDATION FOR OTHER FORMATS
    if (trimmedKey.length >= 8) {
      updateLoadedToolsStats(toolId || "custom", "success", "فحص تنسيق المفتاح", 10);
      return NextResponse.json({
        valid: true,
        message: "نشط (تحقق تلقائي سريع)",
      });
    }

    return NextResponse.json({
      valid: false,
      message: "مفتاح غير صالح أو قصير جداً",
    });
  } catch (err: any) {
    return NextResponse.json({
      valid: false,
      message: `خطأ أثناء المعالجة: ${err?.message || "خطأ داخلي"}`,
    });
  }
}

