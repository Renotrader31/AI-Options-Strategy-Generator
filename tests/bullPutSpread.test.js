import { describe, it } from 'node:test';
import assert from 'node:assert';
import bullPutSpreadStrategy from '../src/strategies/bullPutSpread.js';
import { StrategyValidator } from '../src/validation/strategyValidator.js';
import { OptionType, ActionType } from '../src/types/strategyTypes.js';

describe('Bull Put Spread Strategy Tests', () => {
  
  it('should generate correct legs for bull put spread', () => {
    const params = {
      shortStrike: 180,
      longStrike: 175,
      expiry: "30-45 DTE",
      contracts: 1
    };
    
    const legs = bullPutSpreadStrategy.generateLegs(params);
    
    // Should have exactly 2 legs
    assert.strictEqual(legs.length, 2);
    
    // First leg should be SELL PUT at higher strike
    assert.strictEqual(legs[0].action, ActionType.SELL);
    assert.strictEqual(legs[0].optionType, OptionType.PUT);
    assert.strictEqual(legs[0].strike, 180);
    
    // Second leg should be BUY PUT at lower strike
    assert.strictEqual(legs[1].action, ActionType.BUY);
    assert.strictEqual(legs[1].optionType, OptionType.PUT);
    assert.strictEqual(legs[1].strike, 175);
    
    console.log('✅ Bull put spread legs generated correctly');
  });
  
  it('should format trade setup correctly (MAIN FIX)', () => {
    const params = {
      shortStrike: 180,
      longStrike: 175,
      expiry: "30-45 DTE",
      contracts: 1
    };
    
    const tradeSetup = bullPutSpreadStrategy.formatTradeSetup(params);
    
    // Should NOT show "Buy 180 Call" - this was the bug!
    assert.ok(!tradeSetup.action.includes('Call'));
    assert.ok(!tradeSetup.action.includes('call'));
    
    // Should show correct put spread action
    assert.ok(tradeSetup.action.includes('Put'));
    assert.ok(tradeSetup.action.includes('180'));
    assert.ok(tradeSetup.action.includes('175'));
    
    // Should include both SELL and BUY actions
    assert.ok(tradeSetup.legs.includes('SELL 180 PUT'));
    assert.ok(tradeSetup.legs.includes('BUY 175 PUT'));
    
    console.log('✅ Trade setup formatted correctly:', tradeSetup.action);
  });
  
  it('should validate strategy consistency', () => {
    const tradeSetup = bullPutSpreadStrategy.formatTradeSetup({
      shortStrike: 180,
      longStrike: 175
    });
    
    const validation = StrategyValidator.validateStrategyConsistency(
      bullPutSpreadStrategy, 
      tradeSetup
    );
    
    // Should pass validation (no errors)
    assert.strictEqual(validation.isValid, true);
    assert.strictEqual(validation.errors.length, 0);
    assert.strictEqual(validation.criticalErrors.length, 0);
    
    console.log('✅ Strategy validation passed');
  });
  
  it('should catch the original bug (call in put spread)', () => {
    // Simulate the original buggy setup
    const buggyTradeSetup = {
      action: "Buy 180 Call", // This was the bug!
      legs: ["BUY 180 CALL"],
      expiry: "30-45 DTE",
      contracts: 1
    };
    
    const validation = StrategyValidator.validateStrategyConsistency(
      bullPutSpreadStrategy, 
      buggyTradeSetup
    );
    
    // Should detect the error
    assert.strictEqual(validation.isValid, false);
    assert.ok(validation.criticalErrors.length > 0);
    
    const criticalError = validation.criticalErrors[0];
    assert.strictEqual(criticalError.type, 'STRATEGY_MISMATCH');
    assert.ok(criticalError.message.includes('should not include call options'));
    
    console.log('✅ Bug detection working:', criticalError.message);
  });
  
  it('should calculate correct position metrics', () => {
    const shortStrike = 180;
    const longStrike = 175;
    const premium = 2.50; // Premium collected
    
    const metrics = bullPutSpreadStrategy.calculateMetrics(shortStrike, longStrike, premium);
    
    // Max profit = premium collected
    assert.strictEqual(metrics.maxProfit, 2.50);
    
    // Max loss = strike difference - premium
    assert.strictEqual(metrics.maxLoss, (180 - 175) - 2.50); // 2.50
    
    // Breakeven = short strike - premium
    assert.strictEqual(metrics.breakeven, 180 - 2.50); // 177.50
    
    console.log('✅ Position metrics calculated correctly:', metrics);
  });
  
  it('should have correct strategy properties', () => {
    assert.strictEqual(bullPutSpreadStrategy.name, "Bull Put Spread");
    assert.strictEqual(bullPutSpreadStrategy.description, "Sell put + buy lower strike put");
    assert.strictEqual(bullPutSpreadStrategy.marketBias, "bullish");
    assert.strictEqual(bullPutSpreadStrategy.winRate, 70);
    
    // Greeks should be appropriate for bull put spread
    assert.strictEqual(bullPutSpreadStrategy.greeks.delta, "+");
    assert.strictEqual(bullPutSpreadStrategy.greeks.theta, "+");
    assert.strictEqual(bullPutSpreadStrategy.greeks.vega, "-");
    
    console.log('✅ Strategy properties are correct');
  });
});

describe('Edge Cases and Error Handling', () => {
  
  it('should reject invalid strike configuration', () => {
    const invalidParams = {
      shortStrike: 175, // Lower than long strike - WRONG!
      longStrike: 180,
      contracts: 1
    };
    
    assert.throws(() => {
      bullPutSpreadStrategy.generateLegs(invalidParams);
    }, /Bull put spread requires short strike > long strike/);
    
    console.log('✅ Invalid strike configuration rejected');
  });
});

// Example demonstrating the fix
console.log('\n🔧 DEMONSTRATION OF THE FIX:');
console.log('=====================================');

console.log('\n❌ BEFORE (The Bug):');
console.log('Strategy: Bull Put Spread');
console.log('Trade Setup: "Buy 180 Call" ← WRONG!');

console.log('\n✅ AFTER (Fixed):');
const correctSetup = bullPutSpreadStrategy.formatTradeSetup({
  shortStrike: 180,
  longStrike: 175
});
console.log('Strategy: Bull Put Spread');
console.log(`Trade Setup: "${correctSetup.action}" ← CORRECT!`);
console.log(`Legs: ${correctSetup.legs}`);

export default { bullPutSpreadStrategy, StrategyValidator };