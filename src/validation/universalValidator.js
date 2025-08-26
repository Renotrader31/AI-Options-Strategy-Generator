import { OptionType, ActionType, MarketBias } from '../types/strategyTypes.js';

/**
 * UNIVERSAL OPTIONS STRATEGY VALIDATOR
 * Prevents mismatches across ALL options strategies, not just bull put spreads
 */
export class UniversalStrategyValidator {
  
  /**
   * Validate any options strategy for consistency
   */
  static validateStrategyConsistency(strategy, tradeSetup) {
    const errors = [];
    
    // 1. SPREAD STRATEGY VALIDATION
    if (this.isSpreadStrategy(strategy.name)) {
      const spreadErrors = this.validateSpreadStrategy(strategy, tradeSetup);
      errors.push(...spreadErrors);
    }
    
    // 2. MARKET BIAS CONSISTENCY
    const biasErrors = this.validateMarketBias(strategy, tradeSetup);
    errors.push(...biasErrors);
    
    // 3. OPTION TYPE CONSISTENCY
    const optionTypeErrors = this.validateOptionTypes(strategy, tradeSetup);
    errors.push(...optionTypeErrors);
    
    // 4. ACTION CONSISTENCY
    const actionErrors = this.validateActions(strategy, tradeSetup);
    errors.push(...actionErrors);
    
    // 5. STRUCTURE VALIDATION
    const structureErrors = this.validateStructure(strategy, tradeSetup);
    errors.push(...structureErrors);
    
    return {
      isValid: errors.length === 0,
      errors,
      criticalErrors: errors.filter(e => e.severity === 'CRITICAL'),
      warnings: errors.filter(e => e.severity === 'MEDIUM' || e.severity === 'LOW')
    };
  }
  
  /**
   * Check if strategy is a spread strategy
   */
  static isSpreadStrategy(strategyName) {
    const spreadKeywords = ['spread', 'condor', 'butterfly', 'straddle', 'strangle'];
    const name = strategyName.toLowerCase();
    return spreadKeywords.some(keyword => name.includes(keyword));
  }
  
  /**
   * Validate spread strategies specifically
   */
  static validateSpreadStrategy(strategy, tradeSetup) {
    const errors = [];
    const name = strategy.name.toLowerCase();
    
    // BULL PUT SPREAD - Should only have PUT options
    if (name.includes('bull') && name.includes('put') && name.includes('spread')) {
      const hasCallActions = this.hasCallOptions(tradeSetup);
      if (hasCallActions) {
        errors.push({
          type: 'BULL_PUT_SPREAD_ERROR',
          message: `Bull Put Spread "${strategy.name}" should only use PUT options, not calls`,
          expected: 'SELL higher strike PUT + BUY lower strike PUT',
          actual: 'Contains CALL options',
          severity: 'CRITICAL'
        });
      }
    }
    
    // BULL CALL SPREAD - Should only have CALL options  
    if (name.includes('bull') && name.includes('call') && name.includes('spread')) {
      const hasPutActions = this.hasPutOptions(tradeSetup);
      if (hasPutActions) {
        errors.push({
          type: 'BULL_CALL_SPREAD_ERROR',
          message: `Bull Call Spread "${strategy.name}" should only use CALL options, not puts`,
          expected: 'BUY lower strike CALL + SELL higher strike CALL',
          actual: 'Contains PUT options',
          severity: 'CRITICAL'
        });
      }
    }
    
    // BEAR PUT SPREAD - Should only have PUT options
    if (name.includes('bear') && name.includes('put') && name.includes('spread')) {
      const hasCallActions = this.hasCallOptions(tradeSetup);
      if (hasCallActions) {
        errors.push({
          type: 'BEAR_PUT_SPREAD_ERROR',
          message: `Bear Put Spread "${strategy.name}" should only use PUT options, not calls`,
          expected: 'BUY higher strike PUT + SELL lower strike PUT',
          actual: 'Contains CALL options',
          severity: 'CRITICAL'
        });
      }
    }
    
    // BEAR CALL SPREAD - Should only have CALL options
    if (name.includes('bear') && name.includes('call') && name.includes('spread')) {
      const hasPutActions = this.hasPutOptions(tradeSetup);
      if (hasPutActions) {
        errors.push({
          type: 'BEAR_CALL_SPREAD_ERROR',
          message: `Bear Call Spread "${strategy.name}" should only use CALL options, not puts`,
          expected: 'SELL lower strike CALL + BUY higher strike CALL',
          actual: 'Contains PUT options',
          severity: 'CRITICAL'
        });
      }
    }
    
    // IRON CONDOR - Should have both CALLS and PUTS
    if (name.includes('iron') && name.includes('condor')) {
      const hasCallActions = this.hasCallOptions(tradeSetup);
      const hasPutActions = this.hasPutOptions(tradeSetup);
      
      if (!hasCallActions || !hasPutActions) {
        errors.push({
          type: 'IRON_CONDOR_ERROR',
          message: `Iron Condor "${strategy.name}" must include both CALL and PUT options`,
          expected: 'PUT spread + CALL spread combination',
          actual: `Has calls: ${hasCallActions}, Has puts: ${hasPutActions}`,
          severity: 'CRITICAL'
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Validate market bias consistency
   */
  static validateMarketBias(strategy, tradeSetup) {
    const errors = [];
    const name = strategy.name.toLowerCase();
    
    // Check for bias conflicts
    if (strategy.marketBias === MarketBias.BULLISH && name.includes('bear')) {
      errors.push({
        type: 'BIAS_CONFLICT',
        message: `Strategy name "${strategy.name}" suggests bearish but bias is bullish`,
        severity: 'HIGH'
      });
    }
    
    if (strategy.marketBias === MarketBias.BEARISH && name.includes('bull')) {
      errors.push({
        type: 'BIAS_CONFLICT',
        message: `Strategy name "${strategy.name}" suggests bullish but bias is bearish`,
        severity: 'HIGH'
      });
    }
    
    return errors;
  }
  
  /**
   * Validate option types match strategy
   */
  static validateOptionTypes(strategy, tradeSetup) {
    const errors = [];
    
    // Generate expected legs if possible
    if (strategy.generateLegs) {
      try {
        const testParams = this.getTestParams(strategy);
        const expectedLegs = strategy.generateLegs(testParams);
        
        // Check if trade setup matches expected option types
        const expectedTypes = expectedLegs.map(leg => leg.optionType);
        const actualTypes = this.extractOptionTypesFromSetup(tradeSetup);
        
        const typesMismatch = !this.arraysEqual(expectedTypes.sort(), actualTypes.sort());
        
        if (typesMismatch) {
          errors.push({
            type: 'OPTION_TYPE_MISMATCH',
            message: `Trade setup option types don't match strategy definition`,
            expected: expectedTypes.join(', '),
            actual: actualTypes.join(', '),
            severity: 'HIGH'
          });
        }
        
      } catch (error) {
        // Skip validation if we can't generate test legs
      }
    }
    
    return errors;
  }
  
  /**
   * Validate actions match strategy
   */
  static validateActions(strategy, tradeSetup) {
    const errors = [];
    
    if (strategy.generateLegs) {
      try {
        const testParams = this.getTestParams(strategy);
        const expectedLegs = strategy.generateLegs(testParams);
        
        const expectedActions = expectedLegs.map(leg => leg.action);
        const actualActions = this.extractActionsFromSetup(tradeSetup);
        
        const actionsMismatch = !this.arraysEqual(expectedActions.sort(), actualActions.sort());
        
        if (actionsMismatch) {
          errors.push({
            type: 'ACTION_MISMATCH',
            message: `Trade setup actions don't match strategy definition`,
            expected: expectedActions.join(', '),
            actual: actualActions.join(', '),
            severity: 'HIGH'
          });
        }
        
      } catch (error) {
        // Skip validation if we can't generate test legs
      }
    }
    
    return errors;
  }
  
  /**
   * Validate overall structure
   */
  static validateStructure(strategy, tradeSetup) {
    const errors = [];
    
    if (!tradeSetup.action) {
      errors.push({
        type: 'MISSING_ACTION',
        message: 'Trade setup must include action description',
        severity: 'HIGH'
      });
    }
    
    if (!tradeSetup.legs) {
      errors.push({
        type: 'MISSING_LEGS',
        message: 'Trade setup must include legs information',
        severity: 'HIGH'
      });
    }
    
    return errors;
  }
  
  // =============================================================================
  // HELPER METHODS
  // =============================================================================
  
  static hasCallOptions(tradeSetup) {
    const text = JSON.stringify(tradeSetup).toLowerCase();
    return text.includes('call');
  }
  
  static hasPutOptions(tradeSetup) {
    const text = JSON.stringify(tradeSetup).toLowerCase();
    return text.includes('put');
  }
  
  static extractOptionTypesFromSetup(tradeSetup) {
    const types = [];
    const text = JSON.stringify(tradeSetup).toLowerCase();
    
    const callMatches = text.match(/call/g);
    const putMatches = text.match(/put/g);
    
    if (callMatches) types.push(...Array(callMatches.length).fill('call'));
    if (putMatches) types.push(...Array(putMatches.length).fill('put'));
    
    return types;
  }
  
  static extractActionsFromSetup(tradeSetup) {
    const actions = [];
    const text = JSON.stringify(tradeSetup).toLowerCase();
    
    const buyMatches = text.match(/buy/g);
    const sellMatches = text.match(/sell/g);
    
    if (buyMatches) actions.push(...Array(buyMatches.length).fill('buy'));
    if (sellMatches) actions.push(...Array(sellMatches.length).fill('sell'));
    
    return actions;
  }
  
  static getTestParams(strategy) {
    const name = strategy.name.toLowerCase();
    
    // Default test parameters for different strategy types
    if (name.includes('bull') && name.includes('put')) {
      return { shortStrike: 180, longStrike: 175, contracts: 1 };
    }
    if (name.includes('bull') && name.includes('call')) {
      return { longStrike: 175, shortStrike: 180, contracts: 1 };
    }
    if (name.includes('bear') && name.includes('put')) {
      return { longStrike: 180, shortStrike: 175, contracts: 1 };
    }
    if (name.includes('bear') && name.includes('call')) {
      return { shortStrike: 175, longStrike: 180, contracts: 1 };
    }
    if (name.includes('iron') && name.includes('condor')) {
      return { 
        putSellStrike: 170, 
        putBuyStrike: 165, 
        callSellStrike: 185, 
        callBuyStrike: 190, 
        contracts: 1 
      };
    }
    if (name.includes('iron') && name.includes('butterfly')) {
      return { 
        centerStrike: 180, 
        wingStrike1: 175, 
        wingStrike2: 185, 
        contracts: 1 
      };
    }
    
    // Default fallback
    return { strike: 180, contracts: 1 };
  }
  
  static arraysEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i]);
  }
  
  /**
   * Generate comprehensive validation report
   */
  static generateReport(strategy, tradeSetup) {
    const validation = this.validateStrategyConsistency(strategy, tradeSetup);
    
    return {
      isValid: validation.isValid,
      strategy: strategy.name,
      timestamp: new Date().toISOString(),
      errors: validation.errors,
      criticalCount: validation.criticalErrors.length,
      highCount: validation.errors.filter(e => e.severity === 'HIGH').length,
      summary: validation.isValid ? 
        '✅ All validations passed' : 
        `❌ ${validation.errors.length} validation errors found`,
      recommendations: this.generateRecommendations(validation.errors)
    };
  }
  
  static generateRecommendations(errors) {
    const recommendations = [];
    
    errors.forEach(error => {
      switch (error.type) {
        case 'BULL_PUT_SPREAD_ERROR':
          recommendations.push('Replace call options with put options for bull put spread');
          break;
        case 'BULL_CALL_SPREAD_ERROR':
          recommendations.push('Replace put options with call options for bull call spread');
          break;
        case 'BEAR_PUT_SPREAD_ERROR':
          recommendations.push('Replace call options with put options for bear put spread');
          break;
        case 'BEAR_CALL_SPREAD_ERROR':
          recommendations.push('Replace put options with call options for bear call spread');
          break;
        case 'IRON_CONDOR_ERROR':
          recommendations.push('Ensure iron condor includes both call and put spreads');
          break;
        default:
          recommendations.push('Review strategy configuration for consistency');
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }
}

export default UniversalStrategyValidator;