import { ALL_STRATEGIES, getStrategyByName } from '../strategies/allStrategies.js';
import { SimpleValidator } from '../validation/simpleValidator.js';

/**
 * STRATEGY FACTORY PATTERN
 * Centralized management for all options strategies with built-in validation
 */
export class OptionsStrategyFactory {
  
  constructor() {
    this.strategies = ALL_STRATEGIES;
    this.validator = SimpleValidator;
  }
  
  /**
   * Create a validated strategy setup
   */
  createStrategy(strategyName, params) {
    try {
      const strategy = getStrategyByName(strategyName);
      const tradeSetup = strategy.formatTradeSetup(params);
      
      // Validate before returning
      const validation = this.validator.validateStrategyConsistency(strategy, tradeSetup);
      
      if (!validation.isValid) {
        throw new Error(`Strategy validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
      
      return {
        strategy,
        tradeSetup,
        legs: strategy.generateLegs(params),
        validation,
        isValid: true,
        createdAt: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        strategy: null,
        tradeSetup: null,
        legs: null,
        validation: null,
        isValid: false,
        error: error.message,
        createdAt: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get all available strategies
   */
  getAvailableStrategies() {
    return Object.keys(this.strategies).map(key => ({
      key,
      name: this.strategies[key].name,
      description: this.strategies[key].description,
      marketBias: this.strategies[key].marketBias,
      riskLevel: this.strategies[key].riskLevel,
      winRate: this.strategies[key].winRate,
      bestFor: this.strategies[key].bestFor
    }));
  }
  
  /**
   * Validate existing strategy setup
   */
  validateStrategy(strategyName, tradeSetup) {
    try {
      const strategy = getStrategyByName(strategyName);
      return this.validator.generateReport(strategy, tradeSetup);
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get strategy recommendations based on market conditions
   */
  getRecommendations(marketConditions) {
    const { bias, volatility, timeframe } = marketConditions;
    const recommendations = [];
    
    Object.values(this.strategies).forEach(strategy => {
      let score = 0;
      let reasons = [];
      
      // Market bias matching
      if (strategy.marketBias === bias) {
        score += 3;
        reasons.push(`Matches ${bias} market bias`);
      }
      
      // Volatility considerations
      if (volatility === 'low' && strategy.greeks.theta === '+') {
        score += 2;
        reasons.push('Benefits from time decay in low volatility');
      }
      
      if (volatility === 'high' && strategy.greeks.vega === '+') {
        score += 2;
        reasons.push('Benefits from high volatility');
      }
      
      // Time frame considerations
      if (timeframe === 'short' && strategy.greeks.theta === '+') {
        score += 1;
        reasons.push('Good for short-term time decay');
      }
      
      if (score > 0) {
        recommendations.push({
          strategy: strategy.name,
          score,
          reasons,
          description: strategy.description,
          bestFor: strategy.bestFor
        });
      }
    });
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 recommendations
  }
  
  /**
   * Bulk validate multiple strategies
   */
  bulkValidate(strategiesData) {
    const results = [];
    
    strategiesData.forEach(data => {
      const result = this.validateStrategy(data.strategyName, data.tradeSetup);
      results.push({
        ...data,
        validation: result
      });
    });
    
    return {
      total: results.length,
      valid: results.filter(r => r.validation.isValid).length,
      invalid: results.filter(r => !r.validation.isValid).length,
      results
    };
  }
  
  /**
   * Generate strategy comparison
   */
  compareStrategies(strategyNames, params) {
    const comparisons = [];
    
    strategyNames.forEach(name => {
      const result = this.createStrategy(name, params);
      if (result.isValid) {
        comparisons.push({
          name: result.strategy.name,
          description: result.strategy.description,
          marketBias: result.strategy.marketBias,
          riskLevel: result.strategy.riskLevel,
          winRate: result.strategy.winRate,
          tradeSetup: result.tradeSetup.action,
          legs: result.legs.length,
          greeks: result.strategy.greeks
        });
      }
    });
    
    return comparisons;
  }
}

/**
 * PRE-CONFIGURED FACTORY INSTANCE
 */
export const strategyFactory = new OptionsStrategyFactory();

/**
 * CONVENIENCE FUNCTIONS
 */

export const createBullPutSpread = (shortStrike, longStrike, contracts = 1) => {
  return strategyFactory.createStrategy('Bull Put Spread', {
    shortStrike,
    longStrike, 
    contracts
  });
};

export const createBullCallSpread = (longStrike, shortStrike, contracts = 1) => {
  return strategyFactory.createStrategy('Bull Call Spread', {
    longStrike,
    shortStrike,
    contracts
  });
};

export const createBearCallSpread = (shortStrike, longStrike, contracts = 1) => {
  return strategyFactory.createStrategy('Bear Call Spread', {
    shortStrike,
    longStrike,
    contracts
  });
};

export const createBearPutSpread = (longStrike, shortStrike, contracts = 1) => {
  return strategyFactory.createStrategy('Bear Put Spread', {
    longStrike,
    shortStrike,
    contracts
  });
};

export const createIronCondor = (putSellStrike, putBuyStrike, callSellStrike, callBuyStrike, contracts = 1) => {
  return strategyFactory.createStrategy('Iron Condor', {
    putSellStrike,
    putBuyStrike,
    callSellStrike,
    callBuyStrike,
    contracts
  });
};

export const createIronButterfly = (centerStrike, wingStrike1, wingStrike2, contracts = 1) => {
  return strategyFactory.createStrategy('Iron Butterfly', {
    centerStrike,
    wingStrike1,
    wingStrike2,
    contracts
  });
};

export default OptionsStrategyFactory;