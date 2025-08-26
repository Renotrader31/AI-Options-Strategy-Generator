import { OptionType, ActionType, MarketBias } from '../types/strategyTypes.js';

/**
 * Strategy Validation System
 * Prevents mismatches like showing "Buy Call" for put spread strategies
 */
export class StrategyValidator {
  
  /**
   * Validate that strategy legs match the strategy name and description
   */
  static validateStrategyConsistency(strategy, tradeSetup) {
    const errors = [];
    
    // Check if it's a put spread strategy
    if (strategy.name.toLowerCase().includes('put spread')) {
      // Handle both array and string types for legs
      let hasCallActions = false;
      if (tradeSetup.legs) {
        if (Array.isArray(tradeSetup.legs)) {
          hasCallActions = tradeSetup.legs.some(leg => 
            leg.includes('CALL') || leg.toLowerCase().includes('call')
          );
        } else if (typeof tradeSetup.legs === 'string') {
          hasCallActions = tradeSetup.legs.includes('CALL') || 
                          tradeSetup.legs.toLowerCase().includes('call');
        }
      }
      
      // Also check the action field
      if (tradeSetup.action) {
        hasCallActions = hasCallActions || 
          tradeSetup.action.includes('Call') || 
          tradeSetup.action.toLowerCase().includes('call');
      }
      
      if (hasCallActions) {
        errors.push({
          type: 'STRATEGY_MISMATCH',
          message: `Put spread strategy "${strategy.name}" should not include call options`,
          expected: 'Put options only',
          actual: 'Contains call options',
          severity: 'CRITICAL'
        });
      }
      
      // Validate put spread structure
      const putLegs = strategy.generateLegs ? 
        strategy.generateLegs({ shortStrike: 180, longStrike: 175, contracts: 1 }) : [];
        
      if (putLegs.length !== 2) {
        errors.push({
          type: 'STRUCTURE_ERROR',
          message: 'Put spread must have exactly 2 legs',
          expected: '2 legs (sell put + buy put)',
          actual: `${putLegs.length} legs`,
          severity: 'HIGH'
        });
      }
      
      // Check for correct put spread structure (sell higher strike, buy lower strike)
      if (putLegs.length === 2) {
        const sellLeg = putLegs.find(leg => leg.action === ActionType.SELL);
        const buyLeg = putLegs.find(leg => leg.action === ActionType.BUY);
        
        if (!sellLeg || !buyLeg) {
          errors.push({
            type: 'ACTION_ERROR',
            message: 'Put spread must have one sell and one buy action',
            severity: 'HIGH'
          });
        }
        
        if (sellLeg && buyLeg && sellLeg.strike <= buyLeg.strike) {
          errors.push({
            type: 'STRIKE_ERROR',
            message: 'Bull put spread: sell strike must be higher than buy strike',
            expected: 'Sell strike > Buy strike',
            actual: `Sell ${sellLeg.strike} <= Buy ${buyLeg.strike}`,
            severity: 'HIGH'
          });
        }
        
        // Ensure both legs are puts
        if (sellLeg && sellLeg.optionType !== OptionType.PUT) {
          errors.push({
            type: 'OPTION_TYPE_ERROR',
            message: 'Put spread sell leg must be a put option',
            severity: 'CRITICAL'
          });
        }
        
        if (buyLeg && buyLeg.optionType !== OptionType.PUT) {
          errors.push({
            type: 'OPTION_TYPE_ERROR',
            message: 'Put spread buy leg must be a put option',
            severity: 'CRITICAL'
          });
        }
      }
    }
    
    // Check market bias consistency
    if (strategy.marketBias === MarketBias.BULLISH) {
      if (strategy.name.toLowerCase().includes('bear')) {
        errors.push({
          type: 'BIAS_MISMATCH',
          message: 'Strategy name suggests bearish but bias is bullish',
          severity: 'MEDIUM'
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      criticalErrors: errors.filter(e => e.severity === 'CRITICAL'),
      warnings: errors.filter(e => e.severity === 'MEDIUM' || e.severity === 'LOW')
    };
  }
  
  /**
   * Validate trade setup format
   */
  static validateTradeSetup(tradeSetup) {
    const errors = [];
    
    if (!tradeSetup.action) {
      errors.push({
        type: 'MISSING_ACTION',
        message: 'Trade setup must include action description',
        severity: 'HIGH'
      });
    }
    
    if (!tradeSetup.legs || !Array.isArray(tradeSetup.legs)) {
      errors.push({
        type: 'MISSING_LEGS',
        message: 'Trade setup must include legs array',
        severity: 'HIGH'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Generate validation report
   */
  static generateReport(strategy, tradeSetup) {
    const strategyValidation = this.validateStrategyConsistency(strategy, tradeSetup);
    const setupValidation = this.validateTradeSetup(tradeSetup);
    
    const allErrors = [
      ...strategyValidation.errors,
      ...setupValidation.errors
    ];
    
    return {
      isValid: allErrors.length === 0,
      strategy: strategy.name,
      timestamp: new Date().toISOString(),
      errors: allErrors,
      criticalCount: allErrors.filter(e => e.severity === 'CRITICAL').length,
      highCount: allErrors.filter(e => e.severity === 'HIGH').length,
      summary: allErrors.length === 0 ? 
        '✅ All validations passed' : 
        `❌ ${allErrors.length} validation errors found`
    };
  }
}

export default StrategyValidator;