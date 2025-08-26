/**
 * Type definitions for options strategies
 */

export const OptionType = {
  CALL: 'call',
  PUT: 'put'
};

export const ActionType = {
  BUY: 'buy',
  SELL: 'sell'
};

export const MarketBias = {
  BULLISH: 'bullish',
  BEARISH: 'bearish',
  NEUTRAL: 'neutral'
};

export const RiskLevel = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high'
};

/**
 * Leg of an options strategy
 * @typedef {Object} StrategyLeg
 * @property {string} action - 'buy' or 'sell'
 * @property {string} optionType - 'call' or 'put'
 * @property {number} strike - Strike price
 * @property {number} quantity - Number of contracts
 * @property {string} [expiry] - Expiration date
 */

/**
 * Complete options strategy definition
 * @typedef {Object} OptionsStrategy
 * @property {string} name - Strategy name
 * @property {string} description - Brief description
 * @property {string} marketBias - Market outlook required
 * @property {string} riskLevel - Risk assessment
 * @property {number} winRate - Historical win rate percentage
 * @property {string} bestFor - Ideal market conditions
 * @property {StrategyLeg[]} legs - Array of strategy legs
 * @property {Object} greeks - Expected Greeks profile
 * @property {string} aiReasoning - AI explanation of the strategy
 */

export default {
  OptionType,
  ActionType,
  MarketBias,
  RiskLevel
};