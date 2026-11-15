// Server-side Audio Transcription Route using Google Gemini Multimodal Engine
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "@/lib/auth/serverAuth";

function cleanBase64(base64: string): string {
  if (!base64) return "";
  const commaIndex = base64.indexOf(",");
  if (commaIndex !== -1) {
    return base64.substring(commaIndex + 1);
  }
  return base64;
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return NextResponse.json(
        { success: false, error: "يجب عليك تسجيل الدخول أولاً لاستخدام التسجيل الصوتي.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const { audioBase64, mimeType = "audio/webm", language = "ar" } = body;

    if (!audioBase64) {
      return NextResponse.json(
        { success: false, error: "لم يتم استلام أي بيانات صوتية" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "مفتاح الذكاء الاصطناعي غير متوفر في الخادم" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const cleanData = cleanBase64(audioBase64);
    const audioMime = mimeType.split(";")[0] || "audio/webm";

    const promptText = language === "ar"
      ? "قم بتفريغ وتحويل الصوت المسجل إلى نص مكتوب بدقة فائقة باللغة الأصلية المنطوقة (العربية أو الإنجليزية). اكتب فقط النص المنطوق تماماً دون أي مقدمات أو شروحات أو رموز إضافية. إذا كان الصوت صامتاً أو غير مفهوم، اكتب نصاً فارغاً."
      : "Transcribe the spoken audio verbatim in its spoken language with high precision. Output only the exact transcribed speech without any preamble, metadata or commentary. If silence, output nothing.";

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        {
          inlineData: {
            mimeType: audioMime,
            data: cleanData,
          },
        },
        {
          text: promptText,
        },
      ],
    });

    const transcribedText = response?.text?.trim() || "";

    return NextResponse.json({
      success: true,
      text: transcribedText,
    });
  } catch (error: any) {
    console.error("Audio transcription error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "فشل تفريغ الصوت المسجل",
      },
      { status: 500 }
    );
  }
}
