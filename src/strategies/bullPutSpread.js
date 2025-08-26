import { OptionType, ActionType, MarketBias, RiskLevel } from '../types/strategyTypes.js';

/**
 * Bull Put Spread Strategy - CORRECTED VERSION
 * 
 * This fixes the issue where the system was showing "Buy 180 Call" 
 * instead of the correct put spread actions.
 */
export const bullPutSpreadStrategy = {
  name: "Bull Put Spread",
  description: "Sell put + buy lower strike put",
  marketBias: MarketBias.BULLISH,
  riskLevel: RiskLevel.MODERATE,
  winRate: 70,
  bestFor: "Moderate bullish view with income",
  
  /**
   * Generate the correct legs for a bull put spread
   * @param {Object} params - Strategy parameters
   * @param {number} params.shortStrike - Strike price of the put to sell (higher)
   * @param {number} params.longStrike - Strike price of the put to buy (lower)
   * @param {string} params.expiry - Expiration date
   * @param {number} params.contracts - Number of contracts
   */
  generateLegs: function(params) {
    const { shortStrike, longStrike, expiry = "30-45 DTE", contracts = 1 } = params;
    
    // Validate that short strike > long strike for bull put spread
    if (shortStrike <= longStrike) {
      throw new Error("Bull put spread requires short strike > long strike");
    }
    
    return [
      {
        action: ActionType.SELL,
        optionType: OptionType.PUT,
        strike: shortStrike,
        quantity: contracts,
        expiry: expiry,
        description: `Sell ${shortStrike} Put (collect premium)`
      },
      {
        action: ActionType.BUY,
        optionType: OptionType.PUT,
        strike: longStrike,
        quantity: contracts,
        expiry: expiry,
        description: `Buy ${longStrike} Put (limit risk)`
      }
    ];
  },
  
  /**
   * Calculate position metrics
   */
  calculateMetrics: function(shortStrike, longStrike, premium) {
    const maxProfit = premium;
    const maxLoss = (shortStrike - longStrike) - premium;
    const breakeven = shortStrike - premium;
    
    return {
      maxProfit,
      maxLoss,
      breakeven,
      riskRewardRatio: maxProfit / Math.abs(maxLoss)
    };
  },
  
  greeks: {
    delta: "+", // Positive delta (benefits from upward movement)
    gamma: "0", // Near zero for spreads
    theta: "+", // Positive theta (benefits from time decay)
    vega: "-"   // Negative vega (benefits from decreasing volatility)
  },
  
  aiReasoning: "💰 INCOME PLAY! Sell puts to collect premium with upward momentum",
  
  /**
   * Format the trade setup display - THIS IS THE KEY FIX
   */
  formatTradeSetup: function(params) {
    const legs = this.generateLegs(params);
    
    // Return the CORRECT action description instead of "Buy 180 Call"
    return {
      action: `Sell ${params.shortStrike} Put + Buy ${params.longStrike} Put`,
      expiry: params.expiry || "30-45 DTE",
      contracts: params.contracts || 1,
      legs: legs.map(leg => 
        `${leg.action.toUpperCase()} ${leg.strike} ${leg.optionType.toUpperCase()}`
      ).join(" + ")
    };
  }
};

export default bullPutSpreadStrategy;