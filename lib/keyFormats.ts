/**
 * Provider API Key formats and syntax verification helpers
 */

export interface ProviderKeyFormat {
  providerId: string;
  name: string;
  prefix?: string;
  pattern?: RegExp;
  example: string;
  descriptionAr: string;
}

export const PROVIDER_KEY_FORMATS: Record<string, ProviderKeyFormat> = {
  gemini: {
    providerId: "gemini",
    name: "Google AI (Gemini)",
    pattern: /^(AIza[A-Za-z0-9_-]{20,}|AQ\.[A-Za-z0-9._-]{10,})$/,
    example: "AIzaS... أو AQ....",
    descriptionAr: "يدعم مفاتيح Google التقليدية (AIzaS...) ومفاتيح Auth الجديدة (AQ...)",
  },
  mistral: {
    providerId: "mistral",
    name: "Mistral AI",
    pattern: /^[a-zA-Z0-9_-]{20,}$/,
    example: "mst_... أو سلسلة من 32+ حرفاً",
    descriptionAr: "يتكون من 32 حرفاً أو أكثر من منصة Mistral La Plateforme",
  },
  openai: {
    providerId: "openai",
    name: "OpenAI",
    prefix: "sk-",
    pattern: /^sk-(proj-)?[a-zA-Z0-9_-]{20,}$/,
    example: "sk-proj-... أو sk-...",
    descriptionAr: "يبدأ بـ sk- أو sk-proj- من منصة OpenAI API",
  },
  anthropic: {
    providerId: "anthropic",
    name: "Anthropic",
    prefix: "sk-ant-",
    pattern: /^sk-ant-[a-zA-Z0-9_-]{20,}$/,
    example: "sk-ant-api03-...",
    descriptionAr: "يبدأ بـ sk-ant- من منصة Anthropic Console",
  },
  groq: {
    providerId: "groq",
    name: "Groq",
    prefix: "gsk_",
    pattern: /^gsk_[a-zA-Z0-9_-]{20,}$/,
    example: "gsk_...",
    descriptionAr: "يبدأ بـ gsk_ من منصة Groq Cloud",
  },
  deepseek: {
    providerId: "deepseek",
    name: "DeepSeek",
    prefix: "sk-",
    pattern: /^sk-[a-zA-Z0-9_-]{20,}$/,
    example: "sk-...",
    descriptionAr: "يبدأ بـ sk- من منصة DeepSeek Platform",
  },
  openrouter: {
    providerId: "openrouter",
    name: "OpenRouter",
    prefix: "sk-or-v1-",
    pattern: /^sk-or-v1-[a-zA-Z0-9_-]{20,}$/,
    example: "sk-or-v1-...",
    descriptionAr: "يبدأ بـ sk-or-v1- من منصة OpenRouter",
  },
  cohere: {
    providerId: "cohere",
    name: "Cohere",
    pattern: /^[a-zA-Z0-9_-]{20,}$/,
    example: "سلسلة من 40 حرفاً",
    descriptionAr: "يتكون من 40 حرفاً تقريباً من منصة Cohere Dashboard",
  },
  together: {
    providerId: "together",
    name: "Together AI",
    pattern: /^[a-zA-Z0-9_-]{20,}$/,
    example: "سلسلة من 32+ حرفاً",
    descriptionAr: "يتكون من 32-64 حرفاً من منصة Together AI",
  },
  xai: {
    providerId: "xai",
    name: "xAI (Grok)",
    prefix: "xai-",
    pattern: /^xai-[a-zA-Z0-9_-]{20,}$/,
    example: "xai-...",
    descriptionAr: "يبدأ بـ xai- من منصة xAI Console",
  },
  tavily: {
    providerId: "tavily",
    name: "Tavily Search",
    prefix: "tvly-",
    pattern: /^tvly-[a-zA-Z0-9_-]{10,}$/,
    example: "tvly-...",
    descriptionAr: "يبدأ بـ tvly- من منصة Tavily Search API",
  },
  exa: {
    providerId: "exa",
    name: "Exa Neural Search",
    pattern: /^[a-zA-Z0-9_-]{15,}$/,
    example: "سلسلة أبجدية رقمية من 20+ حرفاً",
    descriptionAr: "مفتاح صيغة UUID أو سلسلة رقمية من منصة Exa AI",
  },
  serper: {
    providerId: "serper",
    name: "Serper Google Search",
    pattern: /^[a-zA-Z0-9_-]{20,}$/,
    example: "سلسلة 40 حرفاً",
    descriptionAr: "يتكون من 40 حرفاً من منصة Serper.dev",
  },
  jina: {
    providerId: "jina",
    name: "Jina Reader",
    prefix: "jina_",
    pattern: /^jina_[a-zA-Z0-9_-]{10,}$/,
    example: "jina_...",
    descriptionAr: "يبدأ بـ jina_ من منصة Jina AI",
  },
  firecrawl: {
    providerId: "firecrawl",
    name: "Firecrawl",
    prefix: "fc-",
    pattern: /^fc-[a-zA-Z0-9_-]{10,}$/,
    example: "fc-...",
    descriptionAr: "يبدأ بـ fc- من منصة Firecrawl",
  },
};

export function validateKeySyntax(providerId: string, key: string): { valid: boolean; messageAr?: string } {
  if (!key || !key.trim()) {
    return { valid: false, messageAr: "المفتاح فارغ" };
  }
  const trimmed = key.trim();
  const format = PROVIDER_KEY_FORMATS[providerId];
  if (!format) {
    if (trimmed.length >= 8) {
      return { valid: true };
    }
    return { valid: false, messageAr: "صيغة المفتاح قصيرة جداً (أقل من 8 أحرف)" };
  }

  if (providerId === "gemini") {
    if (trimmed.startsWith("AIza") || trimmed.startsWith("AQ.")) {
      if (/^(AIza[A-Za-z0-9_-]{20,}|AQ\.[A-Za-z0-9._-]{10,})$/.test(trimmed)) {
        return { valid: true };
      }
      return { valid: false, messageAr: "صيغة مفتاح Google Gemini غير صحيحة. يجب أن يكون مفتاحاً صالحاً يبدأ بـ AIzaS أو AQ." };
    }
    return { valid: false, messageAr: "مفتاح Google Gemini يجب أن يبدأ بـ AIzaS أو AQ." };
  }

  if (format.prefix && !trimmed.startsWith(format.prefix)) {
    return {
      valid: false,
      messageAr: `صيغة المفتاح غير متطابقة. المفتاح لـ ${format.name} يفترض أن يبدأ بـ "${format.prefix}"`,
    };
  }

  if (format.pattern && !format.pattern.test(trimmed)) {
    return {
      valid: false,
      messageAr: `صيغة المفتاح غير صحيحة لـ ${format.name}. (المثال المتوقع: ${format.example})`,
    };
  }

  return { valid: true };
}
