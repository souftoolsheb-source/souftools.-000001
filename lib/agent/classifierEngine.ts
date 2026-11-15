/**
 * SoufTools Hidden Intent Classifier Engine (Gatekeeper Model)
 * 
 * Sub-second, ultra-compact (max 10 tokens) intent triage model.
 * Strict Mandate: Throws clear error if not configured in Admin Dashboard. No default fallback.
 * 
 * Roles:
 * - simple  -> Direct response without agent loop
 * - tools   -> Fast agent with tools execution, skipping cognitive ToT / Reflexion overhead
 * - complex -> Full cognitive agent with ToT, Reflexion, and deep evaluation
 */

import { GoogleGenAI } from "@google/genai";
import { decryptKey } from "@/lib/encryption";
import { ClassifierModelConfig } from "@/lib/adminConfigStore";
import { terminalLogger } from "@/lib/logger/terminalLogger";

export type ClassificationType = "simple" | "tools" | "complex";

export interface ClassifierResult {
  classification: ClassificationType;
  rawResponse: string;
  latencyMs: number;
  model: string;
  provider: string;
}

const CLASSIFIER_SYSTEM_PROMPT = `أنت مصنف نوايا فائق الدقة والسرعة (Intent Classifier).
مهمتك الوحيدة: قراءة رسالة المستخدم وتصنيفها بدقة تامة إلى كلمة واحدة فقط من الكلمات الثلاث التالية دون أي تعليل أو مقدمات أو علامات ترقيم:

1. simple
استخدم هذا التصنيف إذا كانت الرسالة:
- تحية، تعارف، مجاملة، دردشة عامة، أو شكر (مثل: السلام عليكم، كيف حالك، شكراً).
- سؤال نظري مباشر، مفهوم عام، ترجمة، تلخيص نص، أو استفسار علمي لا يتطلب بيانات حية أو حسابات أو أدوات خارجية.

2. tools
استخدم هذا التصنيف إذا كان الطلب يتطلب أداة تنفيذية أو جلب بيانات حية مباشرة:
- معرفة الوقت والتاريخ، التوقيت في دولة ما (أداة get_current_time).
- عمليات حسابية، معادلات رياضية (أداة calculator).
- بحث في الويب عن أخبار، طقس، أسعار عملات، معلومات حية ومحدثة (أداة web_search).
- قراءة رابط موقع، تصفح صفحة، أو فحص كود (أداة open_page / coding).
- إنشاء مستند أو جدول أو ملف PDF أو Word (أداة souf_file).
- إرسال رسالة واتساب أو فحص بريد جيميل.
(أي طلب تنفيذي مباشر لا يحتاج إلى تفكير فلسفي معقد متعدد المسارات).

3. complex
استخدم هذا التصنيف إذا كانت المهمة معقدة جداً:
- بناء نظام متكامل، مشروع برمجي كامل متعدد الملفات.
- استراتيجية أعمال، تحليل مالي مقارن معمق بين عدة جهات، دراسة جدوى شاملة.
- حل مشكلة هندسية أو منطقية صعبة تتطلب تفكيراً متشعباً ومقارنة فرضيات متعددة ونقداً ذاتياً (Tree of Thoughts).

الجواب الإلزامي: كلمة واحدة فقط من (simple / tools / complex). لا تكتب أي شيء آخر.`;

function cleanClassification(text: string): ClassificationType {
  if (!text) return "simple";
  const clean = text.trim().toLowerCase().replace(/[`'".,;:!?\r\n]/g, "");

  if (clean.includes("tools") || clean.includes("tool") || clean.includes("أدوات") || clean.includes("ادوات")) {
    return "tools";
  }
  if (clean.includes("complex") || clean.includes("معقد") || clean.includes("مركب")) {
    return "complex";
  }
  if (clean.includes("simple") || clean.includes("بسيط") || clean.includes("سهل")) {
    return "simple";
  }

  // Fallback safety heuristic
  return "simple";
}

/**
 * Classifies user intent using the configured classifier model.
 * Strict Mandate: Throws clear error if not configured.
 */
export async function classifyUserIntent(
  userPrompt: string,
  config: ClassifierModelConfig
): Promise<ClassifierResult> {
  const startTime = Date.now();

  if (!config || !config.providerId || !config.model || !config.apiKey || config.status === "disabled") {
    throw new Error(
      "خطأ في التهيئة السيادية: لم يتم تعيين نموذج التصنيف الداخلي (Hidden Classifier Model) في لوحة التحكم. " +
      "يجب على المسؤول تحديد المزود والنموذج والمفتاح في قسم المفاتيح قبل تشغيل النظام."
    );
  }

  const effectiveKey = decryptKey(config.apiKey) || config.apiKey;
  const provider = config.providerId.toLowerCase();
  const model = config.model;

  let rawOutput = "";

  try {
    if (provider === "gemini") {
      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      const response = await ai.models.generateContent({
        model: model,
        contents: [
          {
            role: "user",
            parts: [{ text: `${CLASSIFIER_SYSTEM_PROMPT}\n\nرسالة المستخدم المراد تصنيفها:\n"""${userPrompt}"""\n\nالتصنيف:` }],
          },
        ],
        config: {
          maxOutputTokens: 10,
          temperature: 0.0,
        },
      });
      rawOutput = response?.text || "";
    } else if (provider === "anthropic") {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": effectiveKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          temperature: 0.0,
          system: CLASSIFIER_SYSTEM_PROMPT,
          messages: [{ role: "user", content: `رسالة المستخدم:\n"""${userPrompt}"""\n\nالتصنيف:` }],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`فشل استدعاء Anthropic (${resp.status}): ${errText.slice(0, 150)}`);
      }
      const data = await resp.json();
      rawOutput = data?.content?.[0]?.text || "";
    } else {
      // Standard OpenAI-Compatible Endpoint (Groq, OpenAI, DeepSeek, Mistral, OpenRouter, Together, etc.)
      let endpoint = "https://api.openai.com/v1/chat/completions";
      if (provider === "groq") endpoint = "https://api.groq.com/openai/v1/chat/completions";
      else if (provider === "deepseek") endpoint = "https://api.deepseek.com/chat/completions";
      else if (provider === "openrouter") endpoint = "https://openrouter.ai/api/v1/chat/completions";
      else if (provider === "together") endpoint = "https://api.together.xyz/v1/chat/completions";
      else if (provider === "mistral") endpoint = "https://api.mistral.ai/v1/chat/completions";
      else if (provider === "cerebras") endpoint = "https://api.cerebras.ai/v1/chat/completions";
      else if (provider === "sambanova") endpoint = "https://api.sambanova.ai/v1/chat/completions";
      else if (provider === "xai") endpoint = "https://api.x.ai/v1/chat/completions";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${effectiveKey}`,
      };

      if (provider === "openrouter") {
        headers["HTTP-Referer"] = "https://souftools.app";
        headers["X-Title"] = "SoufTools Hidden Classifier";
      }

      const resp = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          temperature: 0.0,
          messages: [
            { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
            { role: "user", content: `رسالة المستخدم:\n"""${userPrompt}"""\n\nالتصنيف:` },
          ],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`فشل استدعاء المزود ${provider} (${resp.status}): ${errText.slice(0, 150)}`);
      }

      const data = await resp.json();
      rawOutput = data?.choices?.[0]?.message?.content || "";
    }

    const latencyMs = Date.now() - startTime;
    const classification = cleanClassification(rawOutput);

    terminalLogger.info("CLASSIFIER", `Gatekeeper triage finished in ${latencyMs}ms -> [${classification}] (raw: "${rawOutput.trim()}")`);

    return {
      classification,
      rawResponse: rawOutput.trim(),
      latencyMs,
      model,
      provider,
    };
  } catch (error: any) {
    terminalLogger.error("CLASSIFIER", `Gatekeeper triage failure: ${error?.message || error}`);
    throw error;
  }
}
