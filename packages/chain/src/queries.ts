import type { Aptos, InputViewFunctionData } from '@aptos-labs/ts-sdk';

export interface Signal {
  id: string;
  reporter: string;
  signal_type: number;
  lat: number;
  lon: number;
  timestamp: string;
  confidence: number;
}

export async function getAllSignals(
  client: Aptos,
  moduleAddress: string,
  registryAddress: string
): Promise<Signal[]> {
  const payload: InputViewFunctionData = {
    function: `${moduleAddress}::core::get_all_signals`,
    functionArguments: [registryAddress],
  };

  const result = await client.view({ payload });

  if (!result || !Array.isArray(result[0])) {
    return [];
  }

  const signals = result[0] as any[];

  return signals.map((s) => ({
    id: String(s.id),
    reporter: s.reporter,
    signal_type: s.signal_type,
    lat: (Number(s.lat) / 1_000_000) - 90,
    lon: (Number(s.lon) / 1_000_000) - 180,
    timestamp: String(s.timestamp),
    confidence: s.confidence,
  }));
}

export async function getReputation(
  client: Aptos,
  moduleAddress: string,
  userAddress: string
): Promise<number> {
  const payload: InputViewFunctionData = {
    function: `${moduleAddress}::reputation::get_reputation`,
    functionArguments: [userAddress],
  };

  const result = await client.view({ payload });

  return Number(result[0]);
}

export async function getProfile(
  client: Aptos,
  moduleAddress: string,
  userAddress: string
): Promise<{ reputation: number; totalSignals: number; joinedAt: string }> {
  const payload: InputViewFunctionData = {
    function: `${moduleAddress}::reputation::get_profile`,
    functionArguments: [userAddress],
  };

  const result = await client.view({ payload });

  return {
    reputation: Number(result[0]),
    totalSignals: Number(result[1]),
    joinedAt: String(result[2]),
  };
}
