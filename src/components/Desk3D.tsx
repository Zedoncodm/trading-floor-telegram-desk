import type React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, N8AO } from "@react-three/postprocessing";
import type { AgentActivity, AgentId, SignalPulse } from "../types.ts";

export interface Desk3DProps {
  activities: Record<AgentId, AgentActivity>;
  pulses: SignalPulse[];
  equity: number;
  currentPnl: number;
  dailyClosedProfit: number;
}

// 8 Agents disposés de façon asymétrique dans l'espace avec des coordonnées et modules dédiés
interface SpatialAgentConfig {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  pos: [number, number, number];
  zoneSize: [number, number, number];
  shape: "core" | "prism" | "ring" | "scanner" | "shield" | "vault" | "radar" | "magnet";
}

const SPATIAL_AGENTS: SpatialAgentConfig[] = [
  // Centre-avant : Chef de Salle (Commandeur)
  { id: "lead", name: "Chef de Salle", role: "Coordination & Arbitrage", color: "#fbbf24", pos: [0, 0, 1.2], zoneSize: [2.2, 0.1, 2.2], shape: "core" },
  // Aile gauche : Analyste Marchés & Données
  { id: "analyst", name: "Analyste Macro", role: "Flux L2 & Structure", color: "#38bdf8", pos: [-3.8, 0.4, 0.5], zoneSize: [2.0, 0.1, 1.8], shape: "scanner" },
  // Aile gauche haute : Stratège Quant
  { id: "strategist", name: "Stratège Quant", role: "WFO & Expectancy", color: "#a855f7", pos: [-2.6, 1.1, -2.4], zoneSize: [2.0, 0.1, 1.8], shape: "prism" },
  // Centre arrière haut : Directeur des Risques
  { id: "risk", name: "Directeur Risques", role: "Contraintes & Kelly", color: "#f43f5e", pos: [0.2, 1.4, -3.2], zoneSize: [2.4, 0.1, 1.8], shape: "shield" },
  // Aile droite haute : Trader d'Exécution
  { id: "execution", name: "Trader Exécution", role: "Micro-ordres & TWAP", color: "#10b981", pos: [2.8, 1.0, -2.2], zoneSize: [2.0, 0.1, 1.8], shape: "ring" },
  // Aile droite : Réviseur de Salle
  { id: "reviewer", name: "Réviseur Journal", role: "Blotter & GRPO Audit", color: "#94a3b8", pos: [4.0, 0.3, 0.8], zoneSize: [2.0, 0.1, 1.8], shape: "vault" },
  // Sentinelle Réseau (Haut)
  { id: "sentinel", name: "Sentinelle RTT", role: "Latence & RTT 3-Tick", color: "#22d3ee", pos: [-1.8, 2.0, -1.0], zoneSize: [1.6, 0.1, 1.6], shape: "radar" },
  // Chasseur de Liquidité (Bas)
  { id: "hunter", name: "Chasseur Liquidité", role: "Spoofing & Magnets", color: "#f97316", pos: [1.8, 0.2, 2.4], zoneSize: [1.8, 0.1, 1.8], shape: "magnet" }
];

const SpatialAgentPod: React.FC<{
  cfg: SpatialAgentConfig;
  activity?: AgentActivity;
}> = ({ cfg, activity }) => {
  const isActive = Boolean(activity && activity.status !== "idle" && activity.status !== "watch");
  const isVeto = activity?.status === "veto";

  useFrame(() => {
    // Boucle de rendu R3F à 60 fps
  });

  const nodeColor = isVeto ? "#ef4444" : cfg.color;

  return (
    <group position={cfg.pos}>
      {/* Plancher holographique personnel de l'agent */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={cfg.zoneSize} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isActive ? 0.35 : 0.08}
          transparent
          opacity={0.22}
          wireframe={!isActive}
        />
      </mesh>

      {/* Halo de flux holographique projeté */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 1.2, 24, 1, true]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={isActive ? 0.18 : 0.04}
          wireframe
        />
      </mesh>

      {/* Noyau central géométrique de l'agent */}
      <mesh position={[0, 0.65, 0]}>
        {cfg.shape === "core" && <octahedronGeometry args={[0.55, 0]} />}
        {cfg.shape === "prism" && <dodecahedronGeometry args={[0.5, 0]} />}
        {cfg.shape === "shield" && <icosahedronGeometry args={[0.52, 0]} />}
        {cfg.shape === "ring" && <torusGeometry args={[0.42, 0.14, 16, 32]} />}
        {cfg.shape === "scanner" && <cylinderGeometry args={[0.45, 0.45, 0.6, 6]} />}
        {cfg.shape === "vault" && <boxGeometry args={[0.65, 0.65, 0.65]} />}
        {cfg.shape === "radar" && <coneGeometry args={[0.48, 0.8, 16]} />}
        {cfg.shape === "magnet" && <torusKnotGeometry args={[0.32, 0.1, 48, 8]} />}
        <meshPhysicalMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isActive ? 2.4 : 0.8}
          metalness={0.4}
          roughness={0.12}
          transmission={0.65}
          thickness={0.6}
          ior={1.4}
          clearcoat={1.0}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Orbes orbitaux d'activité */}
      {isActive && (
        <mesh position={[0.75, 0.9, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive={nodeColor} emissiveIntensity={3.5} />
        </mesh>
      )}
    </group>
  );
};

export const Desk3D: React.FC<Desk3DProps> = ({
  activities,
  pulses,
}) => {
  return (
    <div className="relative w-full h-full bg-[#000000] overflow-hidden">
      <Canvas camera={{ position: [0, 6.2, 9.4], fov: 44 }}>
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={0.25} />
        <pointLight position={[0, 8, 0]} intensity={2.8} color="#38bdf8" />
        <pointLight position={[-4, 4, -2]} intensity={1.5} color="#a855f7" />
        <pointLight position={[4, 4, -2]} intensity={1.5} color="#10b981" />

        {/* Grille spatiale asymétrique au sol */}
        <gridHelper args={[24, 24, "#1e293b", "#090d16"]} position={[0, -0.1, 0]} />

        {/* Rendu des 8 environnements asymétriques */}
        {SPATIAL_AGENTS.map((cfg) => (
          <SpatialAgentPod
            key={cfg.id}
            cfg={cfg}
            activity={activities?.[cfg.id]}
          />
        ))}

        {/* Impulsions holographiques entre agents */}
        {(pulses || []).slice(-8).map((p) => (
          <mesh key={p.id} position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        ))}

        {/* Effets de Post-Processing haut de gamme */}
        <EffectComposer>
          <N8AO aoRadius={0.8} intensity={1.6} />
          <Bloom mipmapBlur luminanceThreshold={0.7} intensity={1.45} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Desk3D;
