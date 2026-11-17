import type { AgentId, AgentPromptConfig, DeskRuntimeSettings, LlmProvider } from "./types.ts";

export const PROMPT_SCHEMA_VERSION = 2;

/**
 * 8 System Prompts experts, 100% en français, conçus pour maximiser l'espérance
 * mathématique nette tout en verrouillant le risque, la discipline Market Profile
 * et la collaboration inter-agents sur « Trading Floor ».
 */
export const DEFAULT_AGENT_PROMPTS: Record<AgentId, AgentPromptConfig> = {
  lead: {
    id: "lead",
    name: "Chef de Salle",
    roleTitle: "01 · Orchestration 8 Agents & Pacing",
    color: "#38bdf8",
    temperature: 0.25,
    systemPrompt: `Tu es le Chef de Salle (Desk Lead) du salon unique « Trading Floor ».
CONSIGNES OPÉRATIONNELLES STRICTES :
- Tu t'exprimes EXCLUSIVEMENT en français, avec autorité calme et précision de directeur de table quantitatif.
- Tu orchestres les 8 agents (Analyste, Stratège, Risk Manager, Exécution, Reviewer, Sentinel, Liquidity Hunter) sans jamais permettre qu'un ordre soit envoyé sans confluence multi-agents (Données vérifiées + Market Profile + Backtest WFO/OOS + Risque calibré).
- Tu pilotes la vélocité et l'Appétit au Risque (Alpha Decay) selon le PnL net réel sans double-comptage, en réduisant la voilure quand le drawdown ou la série perdante apparaît.
- Tu ne réveilles l'humain QUE sur invalidation majeure, conflit analytique réel, veto Sentinel ou approbation manuelle (mode human_confirm avec ID exact).
- Format : 2 à 3 phrases denses et actionnables.`,
  },
  analyst: {
    id: "analyst",
    name: "Analyste Recherche",
    roleTitle: "02 · Multi-Sources, Market Profile & Macro",
    color: "#2dd4bf",
    temperature: 0.2,
    systemPrompt: `Tu es l'Analyste Marché & Recherche (Market & Research Analyst) de « Trading Floor ».
CONSIGNES OPÉRATIONNELLES STRICTES :
- Tu t'exprimes EXCLUSIVEMENT en français et de façon purement factuelle.
- Pour chaque actif analysé, tu vérifies la cohérence de la source primaire et de la 2e source (Binance + Bybit pour la crypto ; Yahoo/MT5 pour Forex, Or et Indices sans jamais confondre les flux).
- Tu synthétises le contexte macro (Volatility Shield, news à fort impact), le Market Profile (POC, VAH, VAL, régime RANGE vs TREND), la session VWAP, le Funding, l'Open Interest et le carnet L2.
- INTERDICTION ABSOLUE de proposer un trade, une entrée ou une direction. Tu livres des faits chiffrés bruts au Stratège (2 à 3 phrases).`,
  },
  strategist: {
    id: "strategist",
    name: "Stratège Quant",
    roleTitle: "03 · Market Profile, WFO 90j+OOS & GRPO",
    color: "#a78bfa",
    temperature: 0.2,
    systemPrompt: `Tu es le Stratège Quant (Strategist) de « Trading Floor ».
CONSIGNES OPÉRATIONNELLES STRICTES :
- Tu t'exprimes EXCLUSIVEMENT en français.
- RÈGLE MARKET PROFILE STRICTE : tu vérifies toujours POC, VAH et VAL avant toute entrée. En marché RANGE, INTERDICTION ABSOLUE de prendre un LONG au-dessus du VAH ou un SHORT en-dessous du VAL ; privilégie alors la Mean-Reversion vers le POC uniquement si le R:R >= 1.3.
- AUTO-CORRECTION DYNAMIQUE : tu obéis impérativement à la directive 15 minutes du Trade Reviewer (current_market_regime_directive). Si les breakouts échouent, tu les bloques immédiatement.
- Tu exiges un backtest purgé 90 jours + OOS 30 jours positif (R:R net positif après frais et slippage), aligné avec les poids RL GRPO et les zones d'aimants de liquidité du Hunter. Sinon, tu TUES l'idée immédiatement (2 à 3 phrases chiffrées).`,
  },
  risk: {
    id: "risk",
    name: "Directeur des Risques",
    roleTitle: "04 · Kelly, Liquidation Guard & Garde-Fou Frais",
    color: "#f472b6",
    temperature: 0.12,
    systemPrompt: `Tu es le Directeur des Risques (Risk Manager) de « Trading Floor ».
CONSIGNES OPÉRATIONNELLES STRICTES :
- Tu t'exprimes EXCLUSIVEMENT en français, sur un ton sec, chirurgical et inflexible.
- Tu calibres la taille exacte sur la distance réelle du Stop-Loss final (mode %, € / $, Pips ou ATR) via Kelly fractionné et Liquidation Guard (marge >= 15% avant liquidation).
- GARDE-FOU FRAIS & ANTI-DEATH-LOOP : tu exerces ton DROIT DE VETO si un stop trop serré génère un notionnel excessif où les frais aller-retour mangent le profit attendu, si l'exposition dépasse les plafonds, ou si un cooldown directionnel 15 min après perte est actif.
- Tu verrouilles le Hard Stop journalier dès que la perte max configurée est atteinte (2 phrases max).`,
  },
  execution: {
    id: "execution",
    name: "Trader d'Exécution",
    roleTitle: "05 · Hard SL/TP, ActiveTradeManager & MT5",
    color: "#fbbf24",
    temperature: 0.12,
    systemPrompt: `Tu es le Trader d'Exécution (Execution Trader) de « Trading Floor ».
CONSIGNES OPÉRATIONNELLES STRICTES :
- Tu t'exprimes EXCLUSIVEMENT en français.
- Tu transmets TOUJOURS un Hard Stop-Loss (SL) et un Hard Take-Profit (TP) côté courtier dès l'envoi de l'ordre (OrderSend via Paper ou Pont MT5 / TradingFloorBridge.mq5).
- ACTIVE TRADE MANAGER : dès que le prix parcourt >= 50% du chemin vers le TP cible, tu déclenches immédiatement un OrderModify() asynchrone pour placer le Hard SL au Break-Even + couverture des frais, sans étouffer le trade prématurément avant qu'il ne couvre ses coûts.
- SÉCURITÉ : tu refuses catégoriquement toute clé API avec permission de retrait (withdrawal) et respectes le mode d'exécution actif (human_confirm par ID exact ou auto) (2 phrases max).`,
  },
  reviewer: {
    id: "reviewer",
    name: "Auditeur & Journal",
    roleTitle: "06 · Post-Mortem 15m, Blotter & GRPO",
    color: "#34d399",
    temperature: 0.2,
    systemPrompt: `Tu es l'Auditeur & Responsable du Journal (Trade Reviewer) de « Trading Floor ».
CONSIGNES OPÉRATIONNELLES STRICTES :
- Tu t'exprimes EXCLUSIVEMENT en français.
- Tu journalises chaque exécution et chaque clôture dans le blotter immuable et dans trade_post_mortem.json (heure, sens, setup, durée, PnL net). INTERDICTION de supprimer un trade perdant.
- BOUCLE D'AUTO-RÉFLEXION 15 MIN : tu analyses périodiquement les derniers post-mortems, identifies sans complaisance si les breakouts échouent ou si les stops sont trop serrés, et mets à jour current_market_regime_directive pour recadrer le Stratège ainsi que la politique RL GRPO.
- Rigueur, lucidité et faits chiffrés (2 à 3 phrases).`,
  },
  sentinel: {
    id: "sentinel",
    name: "The Sentinel",
    roleTitle: "07 · SRE, Latence RTT & Protection Processus",
    color: "#14b8a6",
    temperature: 0.1,
    systemPrompt: `Tu es The Sentinel (Agent 7 SRE & Sécurité Infrastructure) de « Trading Floor ».
CONSIGNES OPÉRATIONNELLES STRICTES :
- Tu surveilles la latence API (RTT moyen 3 ticks > 150ms => blocage HFT Market EXECUTION_HALTED_LATENCY), le Rate-Limit Token Bucket (>85% => throttle non-critique) et l'intégrité du capital (FATAL_DESYNC si dérive brutale hors resync normal).
- En cas d'anomalie critique, tu liquides les positions exposées et mets le desk en HALT sécurisé sans jamais planter silencieusement l'interface de contrôle.
- Parle EXCLUSIVEMENT en français, de façon factuelle et technique (1 à 2 phrases).`,
  },
  hunter: {
    id: "hunter",
    name: "Liquidity Hunter",
    roleTitle: "08 · Microstructure L2, Spoofing & Aimants",
    color: "#f97316",
    temperature: 0.18,
    systemPrompt: `Tu es Liquidity Hunter (Agent 8 Microstructure L2) de « Trading Floor ».
CONSIGNES OPÉRATIONNELLES STRICTES :
- Tu analyses uniquement des carnets L2 réels (jamais de carnet synthétique inventé sur les paires sans profondeur) pour traquer le Spoofing (<500ms) et le déséquilibre Bid/Ask réel.
- Tu repères les zones aimants de liquidation et les probabilités de Long/Short Squeeze (Funding extrême + hausse d'Open Interest) afin d'aider le Stratège à placer ses TP devant la liquidité plutôt que dedans.
- Parle EXCLUSIVEMENT en français, bref et chiffré (1 à 2 phrases).`,
  },
};

export function createDefaultSettings(symbols: string[], scanIntervalMin: number): DeskRuntimeSettings {
  const detected = detectBestCheapProvider();
  return {
    maxRiskPct: 0.03,
    maxExposurePct: 0.10,
    maxDayLossPct: 0.05,
    stopMinPct: 0.004,
    stopMaxPct: 0.25,
    minBacktestTrades90d: 6,
    minOosTrades30d: 3,
    minExpectancyR: 0.05,
    scanIntervalMin,
    overnightStart: 22,
    overnightEnd: 7,
    symbols,
    llmProvider: detected.provider,
    llmModel: detected.model,
    llmEnabled: true,
    llmApiKeyHint: detected.hint,
    autoPaperScalp: false,
    scalpIntervalSec: 15,
    executionMode: "human_confirm",
    tradingStyle: "daytrade",
    trainedLookback: 20,
    trainedAtrMult: 1.35,
    trainedRewardR: 2.0,
    ofiZScoreThreshold: 2.5,
    fixedStopAtr: 1.35,
    fvgMinSizeAtr: 0.5,
    defaultLeverage: 5,
    maintenanceMarginRate: 0.005,
    riskMode: "pct",
    riskPips: 25,
    riskAmount: 100,
    slMode: "atr",
    slVal: 1.35,
    maxLossPerTradeMode: "pct",
    maxLossPerTradeVal: 3,
    maxDayLossMode: "pct",
    maxDayLossVal: 5,
    maxTotalLossMode: "pct",
    maxTotalLossVal: 0,
    autoStopOnMaxLoss: true,
    tpMode: "rr",
    tpVal: 2.0,
    dailyProfitTargetEnabled: false,
    dailyProfitTargetMode: "amount",
    dailyProfitTargetVal: 500,
    progressiveStopEnabled: false,
    mt5Enabled: false,
    mt5DefaultLots: 0.01,
    mt5Connected: false,
    mt5LastStatus: "Non configuré (mode Paper local uniquement)",
  };
}

function env(k: string): string {
  return (process.env[k] ?? "").trim();
}

/**
 * Détecte automatiquement le fournisseur LLM le moins cher / gratuit disponible :
 * 1. FreeLLM local Gateway (`http://127.0.0.1:31415/v1` — auto / auto:fast)
 * 2. Gemini 2.5 Flash-Lite (Gratuit sur Google AI Studio ou ~$0.075/1M tokens)
 * 3. Groq Llama-3.3-70B / 8B (Gratuit sur Groq Cloud)
 * 4. DeepSeek V3 (`deepseek-chat`) (~$0.14/1M tokens)
 * 5. OpenRouter (`google/gemini-2.5-flash-lite` ou `meta-llama/llama-3.3-70b-instruct:free`)
 * 6. OpenAI (`gpt-4o-mini`)
 * 7. Ollama local (`qwen2.5:7b` / `llama3.2` — 100% gratuit sur la machine)
 */
export function detectBestCheapProvider(): { provider: LlmProvider; model: string; hint: string } {
  if (env("FREELLM_API_KEY") || env("FREELLM_KEY")) {
    return { provider: "freellm", model: env("FREELLM_MODEL") || "auto:fast", hint: "Passerelle FreeLLM détectée (.env)" };
  }
  if (env("GEMINI_API_KEY") || env("GOOGLE_API_KEY")) {
    return { provider: "gemini", model: "gemini-2.5-flash-lite", hint: "Clé Gemini détectée (.env)" };
  }
  if (env("GROQ_API_KEY")) {
    return { provider: "groq", model: "llama-3.3-70b-versatile", hint: "Clé Groq détectée (.env)" };
  }
  if (env("DEEPSEEK_API_KEY")) {
    return { provider: "deepseek", model: "deepseek-chat", hint: "Clé DeepSeek détectée (.env)" };
  }
  if (env("OPENROUTER_API_KEY")) {
    return { provider: "openrouter", model: "google/gemini-2.5-flash-lite", hint: "Clé OpenRouter détectée (.env)" };
  }
  if (env("OPENAI_API_KEY")) {
    return { provider: "openai", model: "gpt-4o-mini", hint: "Clé OpenAI détectée (.env)" };
  }
  return {
    provider: "auto",
    model: "gemini-2.5-flash-lite",
    hint: "Mode hybride économique (ajoutez une clé Gemini/Groq/DeepSeek ou utilisez Ollama local)",
  };
}

let runtimeApiKeyOverride = "";

export function setRuntimeLlmApiKey(key: string): void {
  runtimeApiKeyOverride = key.trim();
}

function resolveApiKey(provider: LlmProvider): string {
  if (runtimeApiKeyOverride) return runtimeApiKeyOverride;
  switch (provider) {
    case "freellm":
      return env("FREELLM_API_KEY") || env("FREELLM_KEY") || env("LLM_API_KEY");
    case "gemini":
      return env("GEMINI_API_KEY") || env("GOOGLE_API_KEY") || env("LLM_API_KEY");
    case "groq":
      return env("GROQ_API_KEY") || env("LLM_API_KEY");
    case "deepseek":
      return env("DEEPSEEK_API_KEY") || env("LLM_API_KEY");
    case "openrouter":
      return env("OPENROUTER_API_KEY") || env("LLM_API_KEY");
    case "openai":
      return env("OPENAI_API_KEY") || env("LLM_API_KEY");
    default:
      return (
        env("LLM_API_KEY") ||
        env("GEMINI_API_KEY") ||
        env("GOOGLE_API_KEY") ||
        env("GROQ_API_KEY") ||
        env("DEEPSEEK_API_KEY") ||
        env("OPENROUTER_API_KEY") ||
        env("OPENAI_API_KEY")
      );
  }
}

export async function generateAgentVoice(
  promptCfg: AgentPromptConfig,
  settings: DeskRuntimeSettings,
  situationFacts: string,
  fallbackFrenchText: string,
): Promise<{ text: string; usedProvider: string }> {
  if (!settings.llmEnabled) {
    return { text: fallbackFrenchText, usedProvider: "Moteur déterministe FR (0 coût)" };
  }

  let provider = settings.llmProvider;
  const key = resolveApiKey(provider);

  if (provider === "auto") {
    if (env("FREELLM_API_KEY") || env("FREELLM_KEY")) provider = "freellm";
    else if (env("GEMINI_API_KEY") || env("GOOGLE_API_KEY") || key.startsWith("AIza")) provider = "gemini";
    else if (env("GROQ_API_KEY") || key.startsWith("gsk_")) provider = "groq";
    else if (env("DEEPSEEK_API_KEY")) provider = "deepseek";
    else if (env("OPENROUTER_API_KEY") || key.startsWith("sk-or-")) provider = "openrouter";
    else if (env("OPENAI_API_KEY") || key.startsWith("sk-")) provider = "openai";
  }

  if (provider === "auto" && !key) {
    return { text: fallbackFrenchText, usedProvider: "Moteur déterministe FR (aucune clé LLM active)" };
  }

  const userContent = [
    "FAITS EXACTS DU DESK (tu dois respecter tous les nombres, IDs et décisions ci-dessous sans jamais les inventer ni les contredire) :",
    situationFacts,
    "",
    "Rédige le message final de ton agent en français (2 à 3 phrases maximum, sans markdown inutile, fidèle à ton System Prompt).",
  ].join("\n");

  try {
    if (provider === "gemini") {
      if (!key) return { text: fallbackFrenchText, usedProvider: "Fallback FR (clé Gemini manquante)" };
      const model = settings.llmModel || "gemini-2.5-flash-lite";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: promptCfg.systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userContent }] }],
          generationConfig: {
            temperature: promptCfg.temperature,
            maxOutputTokens: 220,
          },
        }),
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const out = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (out) return { text: out, usedProvider: `Gemini (${model})` };
    }

    if (provider === "ollama") {
      const model = settings.llmModel || "qwen2.5:7b";
      const res = await fetch("http://127.0.0.1:11434/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: "system", content: promptCfg.systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = (await res.json()) as { message?: { content?: string } };
      const out = data.message?.content?.trim();
      if (out) return { text: out, usedProvider: `Ollama Local (${model})` };
    }

    // OpenAI-compatible endpoints: FreeLLM, Groq, DeepSeek, OpenRouter, OpenAI
    const endpointMap: Record<string, { url: string; defaultModel: string; label: string }> = {
      freellm: {
        url: (env("FREELLM_BASE_URL") || "http://127.0.0.1:31415/v1").replace(/\/+$/, "") + "/chat/completions",
        defaultModel: "auto:fast",
        label: "FreeLLM",
      },
      groq: {
        url: "https://api.groq.com/openai/v1/chat/completions",
        defaultModel: "llama-3.3-70b-versatile",
        label: "Groq",
      },
      deepseek: {
        url: "https://api.deepseek.com/chat/completions",
        defaultModel: "deepseek-chat",
        label: "DeepSeek",
      },
      openrouter: {
        url: "https://openrouter.ai/api/v1/chat/completions",
        defaultModel: "google/gemini-2.5-flash-lite",
        label: "OpenRouter",
      },
      openai: {
        url: "https://api.openai.com/v1/chat/completions",
        defaultModel: "gpt-4o-mini",
        label: "OpenAI",
      },
    };

    const target = endpointMap[provider];
    if (target && key) {
      const model = settings.llmModel || target.defaultModel;
      const res = await fetch(target.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          temperature: promptCfg.temperature,
          max_tokens: 220,
          messages: [
            { role: "system", content: promptCfg.systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) throw new Error(`${target.label} HTTP ${res.status}`);
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const out = data.choices?.[0]?.message?.content?.trim();
      if (out) return { text: out, usedProvider: `${target.label} (${model})` };
    }
  } catch {
    // Fallback cleanly to deterministic French message
  }

  return { text: fallbackFrenchText, usedProvider: "Moteur déterministe FR (fallback)" };
}

/**
 * Assistant IA de configuration sur le Board :
 * Permet à l'utilisateur d'écrire en français sur le board, par ex :
 * - "Passe le risque max par trade à 2% et l'exposition max à 8%"
 * - "Rends le Stratège plus strict et exige au moins 10 trades sur le backtest 90j"
 * - "Ajoute BNBUSDT et XRPUSDT aux actifs surveillés"
 * Fonctionne avec OU sans clé API grâce à son interpréteur hybride NL + LLM.
 */
export async function applyAiBoardInstruction(
  instruction: string,
  currentSettings: DeskRuntimeSettings,
  currentPrompts: Record<AgentId, AgentPromptConfig>,
): Promise<{
  summary: string;
  settings: DeskRuntimeSettings;
  prompts: Record<AgentId, AgentPromptConfig>;
}> {
  const nextSettings: DeskRuntimeSettings = { ...currentSettings, symbols: [...currentSettings.symbols] };
  const nextPrompts: Record<AgentId, AgentPromptConfig> = JSON.parse(JSON.stringify(currentPrompts));
  const changes: string[] = [];
  const lower = instruction.toLowerCase();

  // 1. Parse risk / exposure / daily loss percentages
  const riskMatch = instruction.match(/risque[^0-9%]{0,30}?(\d+(?:[.,]\d+)?)\s*%/i);
  if (riskMatch) {
    const val = Math.min(15, Math.max(0.2, Number(riskMatch[1].replace(",", ".")))) / 100;
    nextSettings.maxRiskPct = val;
    changes.push(`Risque max par trade fixé à ${(val * 100).toFixed(2)}%`);
  }

  const expMatch = instruction.match(/exposition[^0-9%]{0,30}?(\d+(?:[.,]\d+)?)\s*%/i);
  if (expMatch) {
    const val = Math.min(50, Math.max(1, Number(expMatch[1].replace(",", ".")))) / 100;
    nextSettings.maxExposurePct = val;
    changes.push(`Exposition totale max fixée à ${(val * 100).toFixed(1)}%`);
  }

  const lossMatch = instruction.match(/perte[^0-9%]{0,30}?(\d+(?:[.,]\d+)?)\s*%/i);
  if (lossMatch) {
    const val = Math.min(25, Math.max(0.5, Number(lossMatch[1].replace(",", ".")))) / 100;
    nextSettings.maxDayLossPct = val;
    changes.push(`Limite de perte journalière fixée à ${(val * 100).toFixed(1)}%`);
  }

  // 2. Parse backtest thresholds
  const btTradesMatch = instruction.match(/(\d+)\s*trades?\s*(?:minimum|min)?\s*(?:sur\s+le\s+backtest|90\s*j)/i);
  if (btTradesMatch) {
    nextSettings.minBacktestTrades90d = Math.max(1, Number(btTradesMatch[1]));
    changes.push(`Minimum de trades Backtest 90j fixé à ${nextSettings.minBacktestTrades90d}`);
  }

  const scanMinMatch = instruction.match(/scan\s*(?:toutes?\s+les|intervalle)?\s*(\d+)\s*min/i);
  if (scanMinMatch) {
    nextSettings.scanIntervalMin = Math.max(1, Math.min(240, Number(scanMinMatch[1])));
    changes.push(`Intervalle de scan fixé à ${nextSettings.scanIntervalMin} min`);
  }

  // 3. Parse symbols to add/remove
  const mentionedSymbols = instruction.toUpperCase().match(/\b[A-Z]{2,10}USDT\b/g);
  if (mentionedSymbols) {
    if (lower.includes("retire") || lower.includes("supprime") || lower.includes("enlève")) {
      nextSettings.symbols = nextSettings.symbols.filter((s) => !mentionedSymbols.includes(s));
      changes.push(`Actifs retirés : ${mentionedSymbols.join(", ")}`);
    } else {
      for (const sym of mentionedSymbols) {
        if (!nextSettings.symbols.includes(sym)) nextSettings.symbols.push(sym);
      }
      changes.push(`Actifs surveillés : ${nextSettings.symbols.join(", ")}`);
    }
  }

  // 4. Target specific agent prompt updates
  const agentAliases: Array<{ id: AgentId; keys: string[] }> = [
    { id: "lead", keys: ["desk lead", "chef de salle", "lead"] },
    { id: "analyst", keys: ["analyste", "analyst", "recherche", "research"] },
    { id: "strategist", keys: ["stratège", "stratege", "strategist", "quant"] },
    { id: "risk", keys: ["risque", "risk", "directeur des risques"] },
    { id: "execution", keys: ["exécution", "execution", "trader", "active trade"] },
    { id: "reviewer", keys: ["auditeur", "reviewer", "journal", "post-mortem"] },
    { id: "sentinel", keys: ["sentinel", "latence", "circuit", "sre"] },
    { id: "hunter", keys: ["hunter", "liquidity", "spoofing", "carnet"] },
  ];

  let targetedAgents: AgentId[] = [];
  for (const a of agentAliases) {
    if (a.keys.some((k) => lower.includes(k))) {
      targetedAgents.push(a.id);
    }
  }
  if (lower.includes("tous les agents") || lower.includes("chaque agent") || lower.includes("tous les bots")) {
    targetedAgents = ["lead", "analyst", "strategist", "risk", "execution", "reviewer", "sentinel", "hunter"];
  }

  for (const agId of targetedAgents) {
    const directive = `\n- CONSIGNE ADDITIONNELLE DE L'OPÉRATEUR : ${instruction.trim()}`;
    if (!nextPrompts[agId].systemPrompt.includes(directive)) {
      nextPrompts[agId].systemPrompt = `${nextPrompts[agId].systemPrompt.trim()}${directive}`;
      changes.push(`System Prompt de « ${nextPrompts[agId].name} » enrichi avec votre consigne`);
    }
  }

  if (changes.length === 0) {
    // Apply as global directive to Desk Lead and Strategist if no specific keyword matched
    const directive = `\n- CONSIGNE OPÉRATEUR : ${instruction.trim()}`;
    nextPrompts.lead.systemPrompt += directive;
    nextPrompts.strategist.systemPrompt += directive;
    changes.push(`Consigne ajoutée aux instructions du Chef de Salle et du Stratège`);
  }

  return {
    summary: changes.join(" · "),
    settings: nextSettings,
    prompts: nextPrompts,
  };
}
