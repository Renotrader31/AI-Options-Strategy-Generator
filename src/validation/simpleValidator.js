import { OptionType, ActionType, MarketBias } from '../types/strategyTypes.js';

/**
 * SIMPLIFIED UNIVERSAL VALIDATOR
 * Focuses on the core issue: strategy name vs trade setup consistency
 */
export class SimpleValidator {
  
  /**
   * Main validation function - checks for critical mismatches
   */
  static validateStrategyConsistency(strategy, tradeSetup) {
    const errors = [];
    const name = strategy.name.toLowerCase();
    
    // 1. PUT SPREAD STRATEGIES - Should only have PUT options
    if (name.includes('put') && name.includes('spread')) {
      const hasCallOptions = this.containsCallOptions(tradeSetup);
      if (hasCallOptions) {
        errors.push({
          type: 'PUT_SPREAD_WITH_CALLS',
          message: `${strategy.name} should only use PUT options, not calls`,
          expected: 'Put options only',
          actual: 'Contains call options',
          severity: 'CRITICAL'
        });
      }
    }
    
    // 2. CALL SPREAD STRATEGIES - Should only have CALL options  
    if (name.includes('call') && name.includes('spread')) {
      const hasPutOptions = this.containsPutOptions(tradeSetup);
      if (hasPutOptions) {
        errors.push({
          type: 'CALL_SPREAD_WITH_PUTS',
          message: `${strategy.name} should only use CALL options, not puts`,
          expected: 'Call options only',
          actual: 'Contains put options',
          severity: 'CRITICAL'
        });
      }
    }
    
    // 3. IRON CONDOR - Must have both CALLS and PUTS
    if (name.includes('iron') && name.includes('condor')) {
      const hasCallOptions = this.containsCallOptions(tradeSetup);
      const hasPutOptions = this.containsPutOptions(tradeSetup);
      
      if (!hasCallOptions || !hasPutOptions) {
        errors.push({
          type: 'IRON_CONDOR_INCOMPLETE',
          message: `${strategy.name} must include both CALL and PUT options`,
          expected: 'Both calls and puts',
          actual: `Calls: ${hasCallOptions}, Puts: ${hasPutOptions}`,
          severity: 'CRITICAL'
        });
      }
    }
    
    // 4. MARKET BIAS CONSISTENCY
    if (strategy.marketBias === 'bullish' && name.includes('bear')) {
      errors.push({
        type: 'BIAS_MISMATCH',
        message: `Strategy name suggests bearish but market bias is bullish`,
        severity: 'MEDIUM'
      });
    }
    
    if (strategy.marketBias === 'bearish' && name.includes('bull')) {
      errors.push({
        type: 'BIAS_MISMATCH',
        message: `Strategy name suggests bullish but market bias is bearish`,
        severity: 'MEDIUM'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      criticalErrors: errors.filter(e => e.severity === 'CRITICAL'),
      warnings: errors.filter(e => e.severity === 'MEDIUM' || e.severity === 'LOW')
    };
  }
  
  /**
   * Generate comprehensive report
   */
  static generateReport(strategy, tradeSetup) {
    const validation = this.validateStrategyConsistency(strategy, tradeSetup);
    
    return {
      isValid: validation.isValid,
      strategy: strategy.name,
      timestamp: new Date().toISOString(),
      errors: validation.errors,
      criticalCount: validation.criticalErrors.length,
      summary: validation.isValid ? 
        '✅ All validations passed' : 
        `❌ ${validation.errors.length} validation errors found`
    };
  }
  
  // =============================================================================
  // HELPER METHODS
  // =============================================================================
  
  static containsCallOptions(tradeSetup) {
    const text = this.getTradeSetupText(tradeSetup);
    return /call/i.test(text);
  }
  
  static containsPutOptions(tradeSetup) {
    const text = this.getTradeSetupText(tradeSetup);
    return /put/i.test(text);
  }
  
  static getTradeSetupText(tradeSetup) {
    if (typeof tradeSetup === 'string') {
      return tradeSetup;
    }
    
    let text = '';
    if (tradeSetup.action) text += tradeSetup.action + ' ';
    if (tradeSetup.legs) {
      if (Array.isArray(tradeSetup.legs)) {
        text += tradeSetup.legs.join(' ');
      } else {
        text += tradeSetup.legs;
      }
    }
    
    return text;
  }
  
  /**
   * Quick validation for the original bug
   */
  static catchOriginalBug(strategy, tradeSetup) {
    const strategyName = strategy.name.toLowerCase();
    const setupText = this.getTradeSetupText(tradeSetup).toLowerCase();
    
    // The original bug: Bull Put Spread showing "Buy Call"
    if (strategyName.includes('bull put spread') && setupText.includes('call')) {
      return {
        isBug: true,
        message: 'ORIGINAL BUG DETECTED: Bull Put Spread showing call options instead of puts',
        fix: 'Replace call options with put options'
      };
    }
    
    // Similar bugs for other strategies
    if (strategyName.includes('put spread') && setupText.includes('call')) {
      return {
        isBug: true,
        message: 'BUG DETECTED: Put spread strategy showing call options',
        fix: 'Replace call options with put options'
      };
    }
    
    if (strategyName.includes('call spread') && setupText.includes('put')) {
      return {
        isBug: true,
        message: 'BUG DETECTED: Call spread strategy showing put options', 
        fix: 'Replace put options with call options'
      };
    }
    
    return {
      isBug: false,
      message: 'No systematic bugs detected'
    };
  }
}

export default SimpleValidator;