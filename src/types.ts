import type {
  AgentActivity,
  ChatMessage,
  EquityPoint,
  MessageTone,
  SignalPulse,
  Speaker,
} from "./events.ts";

export type AgentId = "lead" | "analyst" | "strategist" | "risk" | "execution" | "reviewer" | "sentinel" | "hunter";

export const AGENT_IDS: AgentId[] = [
  "lead",
  "analyst",
  "strategist",
  "risk",
  "execution",
  "reviewer",
  "sentinel",
  "hunter",
];

export const AGENT_NAMES: Record<AgentId, string> = {
  lead: "Chef de Salle (Desk Lead)",
  analyst: "Analyste Marché & Recherche",
  strategist: "Stratège Quant",
  risk: "Directeur des Risques",
  execution: "Trader d'Exécution",
  reviewer: "Auditeur & Journal (Reviewer)",
  sentinel: "The Sentinel (SRE & Latence)",
  hunter: "Liquidity Hunter (L2 & Spoofing)",
};

export const AGENT_MARKS: Record<AgentId, string> = {
  lead: "LD",
  analyst: "RS",
  strategist: "ST",
  risk: "RK",
  execution: "EX",
  reviewer: "RV",
  sentinel: "SN",
  hunter: "LH",
};

export type Direction = "long" | "short";
export type PlayKind =
  | "breakout"
  | "fade"
  | "HFT_OrderFlow_Imbalance"
  | "Session_VWAP_Reversion"
  | "Macro_FVG_Mitigation"
  | "HFT_Kamikaze_FiatTarget";
export type TicketStatus = "pending" | "open" | "closed" | "rejected" | "expired" | "vetoed";
export type CloseReason =
  | "target"
  | "invalidation"
  | "time"
  | "flatten"
  | "halt"
  | "drill"
  | "adverse_selection"
  | "flow_exhaustion";
export type Binding = "risk" | "exposure" | "day";
export type ExecutionMode = "auto" | "human_confirm";

export type LlmProvider = "auto" | "freellm" | "gemini" | "groq" | "deepseek" | "openrouter" | "openai" | "ollama";
export type TradingStyle = "scalping" | "daytrade" | "longtrade";

export type TrainingCandidate = {
  symbol: string;
  timeframe: "15m" | "1h" | "4h";
  playbook: PlayKind;
  lookback: number;
  atrMult: number;
  rewardR: number;
  inSampleTrades: number;
  inSampleWinRate: number;
  inSampleExpR: number;
  oosTrades: number;
  oosWinRate: number;
  oosExpR: number;
  oosProfitFactor: number;
  score: number;
  pass: boolean;
};

export type TrainingReport = {
  at: number;
  style: TradingStyle;
  timeframe: "15m" | "1h" | "4h";
  barsAnalyzed: number;
  combinationsTested: number;
  bestBySymbol: TrainingCandidate[];
  recommendation: string;
};

export type AgentPromptConfig = {
  id: AgentId;
  name: string;
  roleTitle: string;
  color: string;
  systemPrompt: string;
  temperature: number;
};

export type DeskRuntimeSettings = {
  maxRiskPct: number; // default 0.03 (3%)
  maxExposurePct: number; // default 0.10 (10%)
  maxDayLossPct: number; // default 0.05 (5%)
  stopMinPct: number; // default 0.004
  stopMaxPct: number; // default 0.25
  minBacktestTrades90d: number; // default 6
  minOosTrades30d: number; // default 3
  minExpectancyR: number; // default 0.05
  scanIntervalMin: number; // default 15
  overnightStart: number; // default 22
  overnightEnd: number; // default 7
  symbols: string[];
  llmProvider: LlmProvider;
  llmModel: string;
  llmEnabled: boolean;
  llmApiKeyHint: string;
  autoPaperScalp: boolean;
  scalpIntervalSec: number;
  tradesPerMinute?: number;
  focusSymbol?: string;
  strictQuotaMode?: boolean;
  executionMode: ExecutionMode;
  tradingStyle: TradingStyle;
  trainedLookback: number;
  trainedAtrMult: number;
  trainedRewardR: number;
  ofiZScoreThreshold: number;
  fixedStopAtr: number;
  fvgMinSizeAtr: number;
  defaultLeverage: number;
  maintenanceMarginRate: number;
  // Paramètres avancés gestion du risque & TP (Phase 3 — inactifs par défaut)
  riskMode?: "pct" | "pips" | "amount";
  riskPips?: number;
  riskAmount?: number;
  slMode?: "amount" | "atr" | "pips" | "pct";
  slVal?: number;
  maxLossPerTradeMode?: "pct" | "pips" | "amount";
  maxLossPerTradeVal?: number;
  maxDayLossMode?: "pct" | "pips" | "amount";
  maxDayLossVal?: number;
  maxTotalLossMode?: "pct" | "pips" | "amount";
  maxTotalLossVal?: number;
  autoStopOnMaxLoss?: boolean;
  tpMode?: "rr" | "pips" | "pct" | "amount";
  tpVal?: number;
  dailyProfitTargetEnabled?: boolean;
  dailyProfitTargetMode?: "amount" | "pct";
  dailyProfitTargetVal?: number;
  progressiveStopEnabled?: boolean;
  mt5Enabled?: boolean;
  metaApiAccountId?: string;
  mt5Login?: string;
  mt5Server?: string;
  mt5DefaultLots?: number;
  mt5Connected?: boolean;
  mt5LastStatus?: string;
  mt5TokenHint?: string;
  tgChatId?: string;
  tgBotsConfigured?: number;
  regime?: TradingRegime;
  sessionTargetFiat?: number;
  sessionDurationHours?: number;
  hftTargetPnlMin?: number;
  hftTargetPnlMax?: number;
  /** Risque par trade pour le sizing en lots (0.005 - 0.01). Piloté par Strategy_Optimizer. */
  riskPerTradePct?: number;
};

export type TradingRegime = "standard" | "macro_fvg" | "hft_kamikaze";
export type AggressivenessState = "normal" | "lagging_aggressive" | "target_reached" | "secured";

export type SessionGoal = {
  targetProfitFiat: number;
  deadlineTimestamp: number;
  startEquity: number;
  startedAt: number;
  requiredVelocityPerHour: number;
  currentVelocityPerHour: number;
  currentProfitFiat: number;
  aggressiveness: AggressivenessState;
  statusLabel: string;
};

export type MacroWebhookPayload = {
  event: string;
  actual: number;
  forecast: number;
  previous: number;
  timestamp: number;
  impact: "LOW" | "MED" | "HIGH";
  surpriseIndex?: number;
};

export type SocialSentimentSample = {
  symbol: string;
  score: number;
  velocity: number;
  cashtags: string[];
  authorityWeight: number;
  updatedAt: number;
};

export type FomoWebhookPayload = {
  traderId: string;
  winRate: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  leverage: number;
  timestamp: number;
};

export type Kline = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

export type Mark = {
  price: number;
  funding: number | null;
  nextFundingTime: number | null;
  venue: string;
};

export type Headline = { source: string; title: string; at: number; link: string };

export type VenueSnap = {
  venue: "Binance" | "Bybit" | "YahooFinance" | "MT5" | "SimFeed";
  price: number;
  ret1h: number | null;
  funding: number | null;
  oiChange1h: number | null;
  oiValue: number | null;
  book: number | null;
  bestBid?: number;
  bestAsk?: number;
  spreadTicks?: number;
  ofi?: number;
  top5Bids?: [number, number][];
  top5Asks?: [number, number][];
};

export type MicrostructureContext = {
  ofi: number;
  zOfi: number;
  spreadTicks: number;
  volumeTickRatio: number;
  atr1m: number;
  windowSamples: number;
};

export type VwapContext = {
  sessionName: "London" | "NewYork" | "Asia";
  vwap: number;
  sd1Upper: number;
  sd1Lower: number;
  sd2Upper: number;
  sd2Lower: number;
  sd25Upper: number;
  sd25Lower: number;
  ibHigh: number;
  ibLow: number;
  rsi14: number;
  atr15m: number;
  sweptHighReclaim: boolean;
  sweptLowReclaim: boolean;
};

export type FvgZone = {
  direction: Direction;
  top: number;
  bottom: number;
  midPrice: number;
  sizeAtrRatio: number;
  stopLevel: number;
  bosConfirmed: boolean;
  candleTime: number;
};

export type SmcLiquidityLevel = {
  type: "BSL" | "SSL";
  price: number;
  swept: boolean;
  sweepIndex?: number | null;
};

export type SmcOrderBlock = {
  low: number;
  high: number;
  midPrice: number;
  fvgBacked: boolean;
  mitigated: boolean;
};

export type SmcFvgState = {
  status: "UNMITIGATED" | "PARTIALLY_MITIGATED" | "MITIGATED" | "NONE";
  bottom: number;
  top: number;
  midPrice: number;
  fillPct: number;
};

export type SmcInstitutionalContext = {
  symbol: string;
  engine: "smartmoneyconcepts" | "pandas_vectorized" | "ts_ohlcv";
  structureEvent: "BOS" | "CHoCH" | "NONE";
  structureDirection: "LONG" | "SHORT" | "NEUTRAL";
  structureBreakLevel: number;
  sweptLiquidityLevels: SmcLiquidityLevel[];
  orderBlockPrice: SmcOrderBlock;
  fvgState: SmcFvgState;
  mitigationTriggered: boolean;
  liquiditySweepConfirmed: boolean;
  confluenceScore: number;
  validSignal: boolean;
  entryPrice: number;
  stopPrice: number;
  signalJustification: string;
};

export type MarketProfileBin = {
  price: number;
  volume: number;
  inValueArea: boolean;
  isPoc: boolean;
};

export type MarketProfileSummary = {
  symbol: string;
  poc: number;
  vah: number;
  val: number;
  sessionHigh: number;
  sessionLow: number;
  totalVolume: number;
  valueAreaPct: number;
  isRange: boolean;
  pricePosition: "above_vah" | "inside_va" | "below_val";
  bins?: MarketProfileBin[];
  updatedAt: number;
};

export type PostMortemLogEntry = {
  ticketId: string;
  symbol: string;
  closedAt: number;
  closedAtIso: string;
  direction: Direction;
  setup: string;
  thesis: string;
  durationMs: number;
  durationLabel: string;
  pnl: number;
  closeReason: CloseReason;
  summary: string;
};

export type SelfReflectionReviewEntry = {
  id: string;
  at: number;
  atIso: string;
  tradesAnalyzed: number;
  wins: number;
  losses: number;
  netPnl: number;
  rangeCount: number;
  totalProfiles: number;
  directive: string;
  breakdown: string;
  detailedReport?: string;
  recommendations?: string[];
  winRatePct?: number;
  avgWin?: number;
  avgLoss?: number;
  longStats?: { n: number; wins: number; pnl: number };
  shortStats?: { n: number; wins: number; pnl: number };
  assetBreakdown?: Array<{ symbol: string; n: number; wins: number; pnl: number }>;
  setupBreakdown?: Array<{ setup: string; n: number; wins: number; pnl: number }>;
};

export type MarketSnapshot = {
  symbol: string;
  at: number;
  primary: VenueSnap | null;
  secondary: VenueSnap | null;
  bars4h: Kline[];
  bars15m?: Kline[];
  bars1m?: Kline[];
  channelHi: number | null;
  channelLo: number | null;
  atr: number | null;
  ret24h: number | null;
  news: Headline[];
  onchain: string | null;
  errors: string[];
  microstructure?: MicrostructureContext;
  vwapContext?: VwapContext;
  fvgZone?: FvgZone | null;
  smcContext?: SmcInstitutionalContext;
  cascadeWatch?: { active: boolean; reason: string; oiPurging: boolean };
  marketProfile?: MarketProfileSummary;
};

export type BacktestWindow = {
  label: string;
  bars: number;
  trades: number;
  winRate: number;
  expectancyR: number;
  profitFactor: number;
  sharpe: number;
  deflatedSharpe: number;
  maxDrawdownR: number;
  var95R: number;
  pass: boolean;
};

export type Backtest = {
  playbook: PlayKind;
  rules: string;
  source: string;
  inSample: BacktestWindow;
  outOfSample: BacktestWindow;
  pass: boolean;
  killReason?: string;
  equityCurveR?: number[];
  deflatedSharpe?: number;
  frictionModel?: string;
  purgedBars?: number;
};

export type ParameterOptimizationStrategySummary = {
  playbook: PlayKind;
  trades: number;
  stopRate: number;
  timeStopRate: number;
  maxDrawdownR: number;
  prevOosScore: number;
  newOosScore: number;
  oosDsr: number;
  oosPf: number;
  oosExpR: number;
  improved: boolean;
};

export type ParameterOptimizationReport = {
  at: number;
  symbol: string;
  totalTradesReviewed: number;
  stopRate: number;
  timeStopRate: number;
  maxDrawdownR: number;
  prevParams: {
    ofiZScoreThreshold: number;
    fixedStopAtr: number;
    fvgMinSizeAtr: number;
  };
  newParams: {
    ofiZScoreThreshold: number;
    fixedStopAtr: number;
    fvgMinSizeAtr: number;
  };
  updated: boolean;
  reason: string;
  strategies: ParameterOptimizationStrategySummary[];
  reviewerSummary: string;
};

export type Ticket = {
  id: string;
  asset: string;
  direction: Direction;
  playbook: PlayKind;
  thesis: string;
  entry: number;
  invalidation: number;
  target: number;
  timeStopHours: number;
  notional: number;
  qty: number;
  riskUsd: number;
  riskPct: number;
  exposurePct: number;
  binding: Binding;
  producedBy: AgentId[];
  backtest: Backtest;
  status: TicketStatus;
  createdAt: number;
  expiresAt: number;
  decidedAt?: number;
  fillPrice?: number;
  filledAt?: number;
  fees: number;
  funding: number;
  nextFundingAt?: number;
  lastSeenFunding?: number;
  lastCheckedAt?: number;
  exitPrice?: number;
  closedAt?: number;
  closeReason?: CloseReason;
  pnl?: number;
  rMultiple?: number;
  vetoReason?: string;
  /** Notion-style journal metadata (notes, tags, mood/rating, post-mortem) */
  journalNotes?: string;
  journalTags?: string[];
  postMortemReport?: string;
  setupGrade?: "A+" | "A" | "B" | "C";
  sessionName?: string;
  /** Moteurs quantitatifs multi-horizons */
  engine?: PlayKind;
  trailingStop?: number;
  partialTpDone?: boolean;
  partialTpPrice?: number;
  breakEvenActive?: boolean;
  hardSlSyncedAt?: number;
  peakProfitUsd?: number;
  progressiveStopUsd?: number;
  progressiveLockRatio?: number;
  progressiveLockReason?: string;
  timeStopMs?: number;
  fvgMidPrice?: number;
  dsrScore?: number;
  kellyRiskPct?: number;
  leverage?: number;
  liqPrice?: number;
  maxAdverseExcursion?: number;
  fomoBoostApplied?: boolean;
  macroShieldApplied?: boolean;
  grpoAdvantage?: number;
  regime?: string;
  mt5PositionId?: string;
  mt5Lots?: number;
  mt5Profit?: number;
  mt5CurrentPrice?: number;
  /** Pack 15 Skills (Jakeschincariol trader-skill + day-trader-skill) */
  timeMachineWinPct?: number;
  orbSetup?: boolean;
  washSaleFlag?: boolean;
  /** Gouvernance Quantitative Modules 1-3 */
  xaiAudit?: XaiCognitiveAuditReport;
  atrKellySizing?: AtrKellySizingRecord;
  tcaRecord?: TcaTransactionRecord;
};

export type WakeKind = "invalidation" | "conflict" | "halt";

export type Wake = {
  id: string;
  at: number;
  kind: WakeKind;
  text: string;
  ticketId?: string;
  acked: boolean;
  pings: number;
  lastPingAt: number;
};

export type KilledIdea = {
  id: string;
  at: number;
  asset: string;
  playbook: PlayKind;
  reason: string;
  backtest: Backtest;
};

export type LiveTapeRow = {
  symbol: string;
  name: string;
  px: number;
  prev: number;
  change24h: number;
  funding: number | null;
  oiUsd: number | null;
  bookImbalance: number | null;
  venue1: string;
  venue2: string;
  verified2ndSource: boolean;
  sparkline: number[];
  updatedAt: number;
};

export type DeskState = {
  version: 1;
  startEquity: number;
  realizedPnl: number;
  dayKey: string;
  dayStartEquity: number;
  halted: boolean;
  haltKind: "loss" | "manual" | "drill" | null;
  seqDay: string;
  seq: number;
  nonce: number;
  tickets: Ticket[];
  killed: KilledIdea[];
  wakes: Wake[];
  messages: ChatMessage[];
  curve: EquityPoint[];
  tape: LiveTapeRow[];
  activities: Record<AgentId, AgentActivity>;
  pulses: SignalPulse[];
  cooldowns: Record<string, number>;
  directionalCooldowns?: Record<string, { until: number; bannedDir: Direction; reason: string }>;
  reportWeek: string;
  lastScanAt: number;
  lastTickAt: number;
  onOvernight: boolean;
  overnightLog: string[];
  tgOffset: number;
  exchangeNote: string;
  telegramConnected: boolean;
  settings: DeskRuntimeSettings;
  agentPrompts: Record<AgentId, AgentPromptConfig>;
  llmCallCount: number;
  lastLlmProviderUsed: string;
  lastTrainingReport?: TrainingReport;
  lastOptimizationReport?: ParameterOptimizationReport;
  volatilityShieldUntil: number;
  macroEvents: MacroWebhookPayload[];
  socialSentiment: Record<string, SocialSentimentSample>;
  fomoSignals: FomoWebhookPayload[];
  rlSummary?: {
    totalEpisodes: number;
    meanAdvantage: number;
    meanReward?: number;
    klDivergence: number;
    lastUpdated: number;
    regime: string;
    selectedStrategy?: PlayKind;
  };
  sentinel?: SentinelTelemetry;
  liquidityHunter?: LiquidityHunterTelemetry;
  sessionGoal?: SessionGoal;
  quotaTelemetry?: {
    tradesPerMinTarget: number;
    executedLast60s: number;
    focusSymbol: string;
    strictQuotaMode: boolean;
    updatedAt: number;
  };
  marketProfiles?: Record<string, MarketProfileSummary>;
  current_market_regime_directive?: string;
  promptsVersion?: number;
  lastSelfReflectionAt?: number;
  selfReflectionHistory?: SelfReflectionReviewEntry[];
  executionTraderState?: {
    updatedAt: number;
    openCount: number;
    closedCount: number;
    lastOrderModify?: {
      ticketId: string;
      symbol: string;
      newSl: number;
      takeProfit: number;
      reason: string;
      at: number;
    };
  };
  mt5Live?: {
    connected: boolean;
    updatedAt: number;
    login: number;
    server: string;
    currency: string;
    balance: number;
    equity: number;
    profit: number;
    freeMargin: number;
    leverage: number;
    tradeAllowed: boolean;
    positionsCount: number;
    cryptoSupported?: boolean;
    availableCryptos?: string[];
    rejectedOrders?: Array<{ id: string; symbol: string; reason: string }>;
  };
  traderSkills?: TraderSkillsSummary;
  selfAuditHistory?: AgentSelfAuditEntry[];
  structuralGates?: Record<string, AssetStructuralGate>;
  tcaHistory?: TcaTransactionRecord[];
  xaiAuditHistory?: XaiCognitiveAuditReport[];
  atrKellyHistory?: AtrKellySizingRecord[];
  dailyEvolutionState?: DailyEvolutionState;
};

export type TcaTransactionRecord = {
  transaction_id: string;
  instrument_ticker: string;
  direction: "LONG" | "SHORT";
  temporal_markers: {
    decision_timestamp_iso8601: string;
    arrival_timestamp_iso8601: string;
    final_execution_timestamp_iso8601: string;
  };
  execution_metrics: {
    decision_price_p0: number;
    arrival_price_pa: number;
    vwap_benchmark: number;
    average_fill_price: number;
    delay_cost_bps: number;
    trading_slippage_bps: number;
  };
  realized_outcome: {
    net_pnl_usd: number;
    explicit_fees_usd: number;
    opportunity_cost_usd: number;
  };
};

export type XaiCognitiveAuditReport = {
  audit_id: string;
  instrument_ticker?: string;
  direction?: "LONG" | "SHORT";
  temporal_horizon_pit?: string;
  signal_justification?: string;
  smc_traces?: {
    engine: string;
    structure_event: "BOS" | "CHoCH" | "NONE";
    structure_direction: "LONG" | "SHORT" | "NEUTRAL";
    structure_break_level: number;
    swept_liquidity_levels: Array<{ type: "BSL" | "SSL"; price: number; swept: boolean }>;
    order_block_price: { low: number; high: number; mid_price: number; fvg_backed: boolean; mitigated: boolean };
    fvg_state: { status: "UNMITIGATED" | "PARTIALLY_MITIGATED" | "MITIGATED" | "NONE"; bottom: number; top: number; mid_price: number; fill_pct: number };
    mitigation_triggered: boolean;
    liquidity_sweep_confirmed: boolean;
  };
  technical_confluence: {
    macro_trend_alignment: string;
    mathematical_indicators: string[];
  };
  disagree_or_commit_deliberation: {
    bear_thesis_advocate: string;
    resolution_and_commit: string;
  };
};

export type AtrKellySizingRecord = {
  instrument_ticker: string;
  direction: "LONG" | "SHORT";
  atr_14: number;
  adaptive_atr_multiplier: number;
  current_risk_fraction: number;
  stop_loss_level: number;
  take_profit_level: number;
  position_size_units: number;
};

export type DailyEvolutionState = {
  session_date: string;
  inferred_market_regime: "TRENDING" | "RANGE" | "HIGH_VOLATILITY";
  win_rate_p: number;
  win_loss_ratio_b: number;
  full_kelly_f_star: number;
  current_risk_fraction: number;
  max_drawdown_pct: number;
  regime_shift_detected: boolean;
  prompt_genome_mutation_directive: string;
  overwritten_parameters: {
    strategy_mode: string;
    adaptive_atr_multiplier: number;
    reward_to_risk_ratio: number;
    current_risk_fraction: number;
  };
};

export type AgentSelfAuditEntry = {
  id: string;
  at: number;
  atIso: string;
  ticketId: string;
  symbol: string;
  direction: Direction;
  outcome: "WIN_TP" | "LOSS_SL" | "HUMAN_MANUAL_CUT" | "PRE_TRADE_SELF_VETO";
  pnl: number;
  flawsIdentified: string[];
  selfQuestioningSummary: string;
  rootCauseDiagnosis: string;
  autonomousSolutionApplied: string;
  structuralReentryRule: string;
  parameterPatch?: Record<string, string | number>;
};

export type AssetStructuralGate = {
  symbol: string;
  lastDirection: Direction;
  lastExitPrice: number;
  lastEntryPrice: number;
  lastPnl: number;
  lastOutcome: "WIN_TP" | "LOSS_SL" | "HUMAN_MANUAL_CUT";
  at: number;
  requiredPullbackPrice?: number;
  requiredBreakoutPrice?: number;
  requireTrendAlignment: boolean;
  requirePriceAboveEma20?: boolean;
  requirePriceBelowEma20?: boolean;
  riskScaleMultiplier: number;
  reason: string;
};

export type TraderSkillsSummary = {
  installedCount: number;
  installedSkills: string[];
  scannerSignals: Array<{
    symbol: string;
    setup: "ORB_LONG" | "ORB_SHORT" | "FLAT";
    orHigh: number;
    orLow: number;
    orMid: number;
    entryState: "WAITING" | "TRIGGERED" | "EXPIRED";
    rvol: number;
  }>;
  lastTimeMachine?: {
    symbol: string;
    direction: Direction;
    simulations: number;
    targetFirstPct: number;
    stopFirstPct: number;
    openAtClosePct: number;
    historicalWinPct: number;
    pass: boolean;
    verdict: string;
    at: number;
  };
  lastSevenPointRisk?: {
    symbol: string;
    status: "PASS" | "BLOCK";
    passedChecks: string[];
    blockedReasons: string[];
    at: number;
  };
  budgetStatus?: {
    cashBufferPct: number;
    maxPositionCapPct: number;
    freeBufferUsd: number;
    largestWeightPct: number;
  };
  washSaleWarnings: string[];
  overConcentratedSymbols: string[];
  activeAlerts: string[];
  copycatTopConvictions: Array<{ symbol: string; conviction: string; bias: "bull" | "bear" }>;
  updatedAt: number;
};

export type LiquidityMagnetZone = {
  price: number;
  weight: number;
  side: "LONG_LIQ" | "SHORT_LIQ";
};

export type SpoofingAlert = {
  symbol: string;
  side: "BID" | "ASK";
  price: number;
  wallSize: number;
  durationMs: number;
  at: number;
};

export type SentinelTelemetry = {
  lastRttMs: number;
  rollingRttMs: number;
  ledStatus: "GREEN" | "YELLOW" | "RED";
  latencyHalted: boolean;
  rateLimitUsedWeight: number;
  rateLimitMaxWeight: number;
  rateLimitUsagePct: number;
  throttlingNonCritical: boolean;
  fatalDesyncReason?: string;
  updatedAt: number;
};

export type LiquidityHunterTelemetry = {
  symbol: string;
  imbalance: number;
  bidWallUsd: number;
  askWallUsd: number;
  heatBars: number[];
  spoofingAlerts: SpoofingAlert[];
  squeezeSignal?: "HIGH_PROBABILITY_LONG_SQUEEZE" | "HIGH_PROBABILITY_SHORT_SQUEEZE" | null;
  squeezeProbability: number;
  liquidityMagnetZones: LiquidityMagnetZone[];
  updatedAt: number;
};

export type {
  AgentActivity,
  ChatMessage,
  EquityPoint,
  MessageTone,
  SignalPulse,
  Speaker,
};
