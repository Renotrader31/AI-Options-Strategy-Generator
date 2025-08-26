import bullPutSpreadStrategy from '../src/strategies/bullPutSpread.js';
import { StrategyValidator } from '../src/validation/strategyValidator.js';

/**
 * Examples demonstrating the bull put spread fix
 */

console.log('🔧 BULL PUT SPREAD FIX EXAMPLES');
console.log('================================\n');

// Example 1: The Original Problem
console.log('❌ EXAMPLE 1: The Original Problem');
console.log('-----------------------------------');
console.log('What the user saw in the UI:');
console.log('  Strategy: "Bull Put Spread Strategy Details"');
console.log('  Description: "Sell put + buy lower strike put"');
console.log('  Trade Setup: "Buy 180 Call" ← WRONG!');
console.log('  This creates confusion and incorrect trades!\n');

// Example 2: The Corrected Version
console.log('✅ EXAMPLE 2: The Corrected Version');
console.log('-----------------------------------');

const exampleParams = {
  shortStrike: 180,
  longStrike: 175,
  expiry: "30-45 DTE",
  contracts: 1
};

const correctedSetup = bullPutSpreadStrategy.formatTradeSetup(exampleParams);
const legs = bullPutSpreadStrategy.generateLegs(exampleParams);

console.log('What the user sees now:');
console.log(`  Strategy: "${bullPutSpreadStrategy.name}"`);
console.log(`  Description: "${bullPutSpreadStrategy.description}"`);
console.log(`  Trade Setup: "${correctedSetup.action}" ← CORRECT! ✅`);
console.log(`  Legs: ${correctedSetup.legs}`);
console.log('\nDetailed breakdown:');
legs.forEach((leg, i) => {
  console.log(`    ${i + 1}. ${leg.action.toUpperCase()} ${leg.strike} ${leg.optionType.toUpperCase()} - ${leg.description}`);
});

// Example 3: Validation in Action
console.log('\n🛡️ EXAMPLE 3: Validation System Catching Errors');
console.log('------------------------------------------------');

// Test with the original buggy setup
const buggySetup = {
  action: "Buy 180 Call",
  legs: ["BUY 180 CALL"]
};

const validation = StrategyValidator.validateStrategyConsistency(bullPutSpreadStrategy, buggySetup);

console.log('Testing the original buggy setup:');
console.log(`  Input: "${buggySetup.action}"`);
console.log(`  Valid: ${validation.isValid}`);
console.log(`  Errors: ${validation.errors.length}`);

if (!validation.isValid) {
  console.log('  Error Details:');
  validation.errors.forEach((error, i) => {
    console.log(`    ${i + 1}. [${error.severity}] ${error.message}`);
  });
}

// Example 4: Multiple Strike Scenarios
console.log('\n💰 EXAMPLE 4: Different Strike Price Scenarios');
console.log('----------------------------------------------');

const scenarios = [
  { shortStrike: 200, longStrike: 195, premium: 3.00 },
  { shortStrike: 180, longStrike: 175, premium: 2.50 },
  { shortStrike: 160, longStrike: 155, premium: 2.00 }
];

scenarios.forEach((scenario, i) => {
  const setup = bullPutSpreadStrategy.formatTradeSetup(scenario);
  const metrics = bullPutSpreadStrategy.calculateMetrics(
    scenario.shortStrike, 
    scenario.longStrike, 
    scenario.premium
  );
  
  console.log(`\n  Scenario ${i + 1}:`);
  console.log(`    Setup: ${setup.action}`);
  console.log(`    Max Profit: $${metrics.maxProfit.toFixed(2)}`);
  console.log(`    Max Loss: $${Math.abs(metrics.maxLoss).toFixed(2)}`);
  console.log(`    Breakeven: $${metrics.breakeven.toFixed(2)}`);
});

// Example 5: Integration with UI Components
console.log('\n🖥️ EXAMPLE 5: How to Integrate with UI');
console.log('--------------------------------------');
console.log('In your React/Vue/Angular component:');
console.log(`
// Import the fixed strategy
import bullPutSpreadStrategy from './strategies/bullPutSpread.js';

// Generate the correct trade setup
const tradeSetup = bullPutSpreadStrategy.formatTradeSetup({
  shortStrike: currentPrice + 5, // Slightly out of the money
  longStrike: currentPrice - 5,  // Further out of the money
  expiry: "30-45 DTE",
  contracts: 1
});

// Display in your UI
<div className="strategy-card">
  <h2>{bullPutSpreadStrategy.name}</h2>
  <p>{bullPutSpreadStrategy.description}</p>
  
  <div className="trade-setup">
    <h3>Specific Trade Setup</h3>
    <p><strong>Action:</strong> {tradeSetup.action}</p>  {/* Now shows correct put spread! */}
    <p><strong>Expiry:</strong> {tradeSetup.expiry}</p>
    <p><strong>Contracts:</strong> {tradeSetup.contracts}</p>
  </div>
  
  <div className="ai-reasoning">
    <p>{bullPutSpreadStrategy.aiReasoning}</p>
  </div>
</div>
`);

console.log('\n🚀 IMPLEMENTATION CHECKLIST:');
console.log('----------------------------');
console.log('✅ 1. Replace hardcoded "Buy 180 Call" with dynamic strategy.formatTradeSetup()');
console.log('✅ 2. Add StrategyValidator.validateStrategyConsistency() before displaying');
console.log('✅ 3. Use strategy.generateLegs() for detailed leg information');
console.log('✅ 4. Implement proper error handling for invalid configurations');
console.log('✅ 5. Add unit tests to prevent regression');

console.log('\n🎯 KEY TAKEAWAYS:');
console.log('-----------------');
console.log('• Bull put spreads involve SELLING and BUYING puts, not calls');
console.log('• Always validate strategy consistency before displaying to users');
console.log('• Use structured data instead of hardcoded strings');
console.log('• Implement proper error handling and validation');
console.log('• Test edge cases to prevent future issues');

export { exampleParams, correctedSetup, validation };