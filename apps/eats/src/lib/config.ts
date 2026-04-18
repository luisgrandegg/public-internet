/**
 * Platform configuration values.
 *
 * Constitution: the infrastructure fee is a flat per-order amount that covers
 * actual operating costs. It is never a percentage of the order, never demand-adjusted,
 * and is always visible before the customer confirms an order.
 *
 * Operators (municipalities, cooperatives) configure this by setting
 * EATS_INFRASTRUCTURE_FEE_CENTS in their environment. The default of 99 cents
 * (€0.99) is suitable for a small local node.
 */

function readIntFromEnv(envVar: string, fallback: number): number {
  const raw = process.env[envVar]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed < 0) return fallback
  return parsed
}

/**
 * Flat infrastructure fee applied to every order, in cents.
 * Published publicly (never hidden) and shown to the customer before confirming.
 */
export const INFRASTRUCTURE_FEE_CENTS = readIntFromEnv('EATS_INFRASTRUCTURE_FEE_CENTS', 99)

/**
 * Default courier base pay for a delivery, in cents.
 * This is the flat per-delivery floor, shown to the courier before they accept.
 */
export const DEFAULT_COURIER_BASE_PAY_CENTS = readIntFromEnv('EATS_COURIER_BASE_PAY_CENTS', 400)

/**
 * Default courier distance pay for a delivery, in cents.
 * In a real deployment this would scale by distance — at this stage it is a
 * flat placeholder that must still be shown separately from basePay so the
 * worker can see the full breakdown.
 */
export const DEFAULT_COURIER_DISTANCE_PAY_CENTS = readIntFromEnv('EATS_COURIER_DISTANCE_PAY_CENTS', 200)
