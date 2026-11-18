import { Mt5CloudBridge } from "./mt5.ts";
import { createInterface } from "node:readline";
import { ConfigError, loadConfig } from "./config.ts";
import { TradingFloorDesk } from "./desk.ts";
import { startDashboardServer } from "./server.ts";
import { DeskStore } from "./store.ts";
import { TelegramFloorRoom } from "./telegram.ts";
import { AGENT_NAMES } from "./types.ts";
import { StrategyOptimizerAgent } from "./agents/strategyOptimizer.ts";
import { TelegramDeskService } from "./services/telegramDesk.ts";

async function main(): Promise<void> {
  let cfg;
  try {
    cfg = loadConfig(process.argv.slice(2));
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`\n[Configuration Error] ${err.message}`);
      console.error(`Astuce : lancez "npm run sim" pour démarrer avec le Dashboard 3D sans tokens Telegram.\n`);
      process.exit(1);
    }
    throw err;
  }

  const store = new DeskStore(cfg.dataDir);
  const tg = new TelegramFloorRoom(cfg);
  const desk = new TradingFloorDesk(cfg, store, tg);

  const uiPort = Number(process.env.UI_PORT || 4080);
  const optimizer = new StrategyOptimizerAgent(desk, cfg.dataDir, cfg.timeZone);
  const tgDesk = new TelegramDeskService(desk, tg, optimizer);
  optimizer.onReport((r) => {
    console.log(`[Strategy_Optimizer] ${StrategyOptimizerAgent.summarize(r)}`);
    tgDesk.onOptimizerReport(r);
  });
  const web = startDashboardServer(desk, uiPort, optimizer);

  process.on("unhandledRejection", (reason) => {
    console.error("[TradingFloor] UnhandledRejection interceptée (serveur maintenu actif) :", reason);
  });
  process.on("uncaughtException", (err) => {
    console.error("[TradingFloor] UncaughtException interceptée (serveur maintenu actif) :", err);
  });

  setInterval(() => {
    void desk.syncWithLocalMt5Bridge().catch((e) => console.error("[MT5 Sync Error]", e));
  }, 1000);

  console.log("==================================================================");
  console.log("  TRADING FLOOR · 8-AGENT QUANT DESK + MT5 LOCAL COMMAND");
  console.log("==================================================================");
  console.log(`  Mode d'exécution : PAPER ONLY (aucun retrait autorisé)`);
  console.log(`  Dashboard 3D Web : ${web.url}`);
  console.log(`  Blotter journal  : ${store.blotterPath}`);
  console.log("------------------------------------------------------------------");

  const botCheck = await tg.verifyBots();
  for (const line of botCheck.details) {
    console.log(`  ${line}`);
  }
  console.log("==================================================================\n");

  await desk.bootstrapIfFresh();
  if (Mt5CloudBridge.readLocalMt5State()) {
    await desk.syncWithLocalMt5Bridge().catch((e) => console.error("[MT5 Boot Sync Error]", e));
  }

  // Print new messages to terminal console as well
  let printedCount = desk.state.messages.length;
  desk.subscribe((st) => {
    while (printedCount < st.messages.length) {
      const m = st.messages[printedCount++];
      if (!m) break;
      const who = m.speaker === "human" ? "YOU" : AGENT_NAMES[m.speaker];
      console.log(`[${new Date(m.at).toLocaleTimeString("fr-FR")}] [${who}] ${m.text.replace(/\n/g, " | ")}`);
    }
  });

  // Fast 1s market monitor loop so responsive scalp, stops, and high trades/min trigger cleanly
  setInterval(() => {
    void desk.monitorStep().catch((e) => console.error("[MonitorStep Error]", e));
  }, 1000);

  // Strategy_Optimizer (méta-stratège) : tâche de fond. Remplace le CRON 15 min de self-reflection
  // du Reviewer (désormais limité à l'audit individuel). Déclenchement : tous les N trades clôturés
  // (vérifié à chaque mise à jour d'état) + fin de journée (vérifié chaque minute).
  desk.subscribe(() => {
    optimizer.tick();
    try {
      tgDesk.onState();
    } catch (e) {
      console.error("[TelegramDesk Error]", e);
    }
  });
  setInterval(() => optimizer.tick(), 60_000);
  void tg.registerCommands().catch(() => {});

  // Telegram group chat polling loop (checks live so UI token config activates immediately without restart)
  setInterval(async () => {
    try {
      if (!tg.hasTokens()) return;
      const { nextOffset, commands } = await tg.pollCommands(desk.state.tgOffset);
      if (nextOffset !== desk.state.tgOffset) {
        desk.state.tgOffset = nextOffset;
        store.save(desk.state);
      }
      for (const cmd of commands) {
        if (await tgDesk.handleCommand(cmd.text)) continue;
        await desk.handleHumanInput(cmd.text, "telegram");
      }
    } catch (e) {
      console.error("[Telegram Poll Error]", e);
    }
  }, 2500);

  // Interactive terminal input (works alongside Web UI and Telegram)
  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (trimmed) void desk.handleHumanInput(trimmed, "desk");
    });
  }
}

void main();
