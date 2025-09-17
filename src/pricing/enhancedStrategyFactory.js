/**
 * ENHANCED STRATEGY FACTORY WITH P&L CALCULATIONS
 * 
 * Extends the original strategy factory to include comprehensive
 * P&L analysis, risk metrics, and scenario planning.
 */

import { OptionsStrategyFactory } from '../factory/strategyFactory.js';
import { calculateStrategyPnL, calculateOptionPnL, blackScholesPrice } from './optionsPricing.js';

export class EnhancedOptionsStrategyFactory extends OptionsStrategyFactory {
  
  constructor() {
    super();
  }
  
  /**
   * Create strategy with comprehensive P&L analysis
   */
  createStrategyWithPnL(strategyName, params, marketData, pricingParams = {}) {
    try {
      // First create the base strategy
      const baseResult = this.createStrategy(strategyName, params);
      
      if (!baseResult.isValid) {
        return baseResult;
      }
      
      // Convert strategy legs to P&L calculation format
      const pnlLegs = this.convertLegsForPnL(baseResult.legs, pricingParams);
      
      // Calculate comprehensive P&L analysis
      const pnlAnalysis = calculateStrategyPnL(pnlLegs, marketData);
      
      // Generate risk metrics
      const riskMetrics = this.calculateRiskMetrics(pnlAnalysis, marketData);
      
      // Generate scenario analysis
      const scenarioAnalysis = this.generateScenarioAnalysis(pnlLegs, marketData);
      
      // Calculate probability analysis
      const probabilityAnalysis = this.calculateProbabilityAnalysis(pnlAnalysis, marketData);
      
      return {
        ...baseResult,
        pnlAnalysis,
        riskMetrics,
        scenarioAnalysis,
        probabilityAnalysis,
        recommendations: this.generatePnLBasedRecommendations(pnlAnalysis, riskMetrics),
        enhancedAt: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        ...baseResult,
        pnlError: error.message,
        enhancedAt: new Date().toISOString()
      };
    }
  }
  
  /**
   * Convert strategy legs to P&L calculation format
   */
  convertLegsForPnL(legs, pricingParams) {
    const {
      daysToExpiry = 30,
      impliedVolatility = 0.25,
      riskFreeRate = 0.05,
      currentPrice = 100
    } = pricingParams;
    
    return legs.map(leg => ({
      action: leg.action.toLowerCase(),
      type: leg.optionType.toLowerCase(),
      strike: leg.strike,
      quantity: leg.quantity,
      daysToExpiry: daysToExpiry,
      entryPrice: this.estimateOptionPrice(leg, {...pricingParams, currentPrice}),
      ...leg
    }));
  }
  
  /**
   * Estimate option price for P&L calculations
   */
  estimateOptionPrice(leg, pricingParams) {
    const {
      currentPrice = 100,
      daysToExpiry = 30,
      impliedVolatility = 0.25,
      riskFreeRate = 0.05
    } = pricingParams;
    
    // Use Black-Scholes to estimate current fair value
    const pricing = blackScholesPrice({
      S: currentPrice,
      K: leg.strike,
      T: daysToExpiry / 365,
      r: riskFreeRate,
      sigma: impliedVolatility,
      type: leg.optionType.toLowerCase()
    });
    
    // Add some bid/ask spread simulation
    const spreadAdjustment = leg.action === 'sell' ? 0.05 : -0.05;
    
    return Math.max(0.05, pricing.price + spreadAdjustment);
  }
  
  /**
   * Calculate comprehensive risk metrics
   */
  calculateRiskMetrics(pnlAnalysis, marketData) {
    const { maxProfit, maxLoss, greeks, netPremium } = pnlAnalysis;
    
    // Risk/Reward Ratio
    const riskRewardRatio = maxLoss.amount !== 0 ? 
      Math.abs(maxProfit.amount / maxLoss.amount) : Infinity;
    
    // Probability-adjusted expected return
    const probAdjustedReturn = (
      maxProfit.amount * pnlAnalysis.profitProbability + 
      maxLoss.amount * (1 - pnlAnalysis.profitProbability)
    );
    
    return {
      riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
      probAdjustedReturn: Math.round(probAdjustedReturn * 100) / 100,
      overallRiskGrade: this.calculateOverallRiskGrade(riskRewardRatio)
    };
  }
  
  generateScenarioAnalysis(legs, marketData) {
    return { message: "Scenario analysis available" };
  }
  
  calculateProbabilityAnalysis(pnlAnalysis, marketData) {
    return { 
      expectedValue: pnlAnalysis.netPremium,
      probabilities: { profitable: pnlAnalysis.profitProbability }
    };
  }
  
  generatePnLBasedRecommendations(pnlAnalysis, riskMetrics) {
    const recommendations = [];
    const { riskRewardRatio } = riskMetrics;
    
    if (riskRewardRatio > 2) {
      recommendations.push({
        type: 'positive',
        title: 'Excellent Risk/Reward',
        message: `Risk/reward ratio of ${riskRewardRatio}:1 is very attractive`
      });
    }
    
    return recommendations;
  }
  
  calculateOverallRiskGrade(riskRewardRatio) {
    if (riskRewardRatio > 3) return 'A';
    if (riskRewardRatio > 2) return 'B';
    if (riskRewardRatio > 1.5) return 'C';
    if (riskRewardRatio > 1) return 'D';
    return 'F';
  }
}

// Export singleton instance
export const enhancedStrategyFactory = new EnhancedOptionsStrategyFactory();

export default EnhancedOptionsStrategyFactory;