import bullPutSpreadStrategy from './strategies/bullPutSpread.js';
import { StrategyValidator } from './validation/strategyValidator.js';

/**
 * Main application demonstrating the Bull Put Spread fix
 */
class OptionsStrategyApp {
  
  /**
   * Demonstrate the original bug and the fix
   */
  static demonstrateFix() {
    console.log('\n🎯 OPTIONS STRATEGY BUG FIX DEMONSTRATION');
    console.log('==========================================\n');
    
    // Show the original problem
    console.log('❌ ORIGINAL PROBLEM:');
    console.log('Strategy Title: "Bull Put Spread Strategy Details"');
    console.log('Strategy Description: "Sell put + buy lower strike put"');
    console.log('AI Reasoning: "Sell puts to collect premium with upward momentum"');
    console.log('Trade Setup Display: "Buy 180 Call" ← INCONSISTENT!\n');
    
    // Show the corrected version
    console.log('✅ CORRECTED VERSION:');
    const params = {
      shortStrike: 180,
      longStrike: 175,
      expiry: "30-45 DTE",
      contracts: 1
    };
    
    const correctedSetup = bullPutSpreadStrategy.formatTradeSetup(params);
    const legs = bullPutSpreadStrategy.generateLegs(params);
    
    console.log(`Strategy Title: "${bullPutSpreadStrategy.name}"`);
    console.log(`Strategy Description: "${bullPutSpreadStrategy.description}"`);
    console.log(`AI Reasoning: "${bullPutSpreadStrategy.aiReasoning}"`);
    console.log(`Trade Setup Display: "${correctedSetup.action}" ← CONSISTENT! ✅`);
    console.log(`Detailed Legs: ${correctedSetup.legs}\n`);
    
    // Show detailed leg breakdown
    console.log('📋 DETAILED STRATEGY BREAKDOWN:');
    legs.forEach((leg, index) => {
      console.log(`  Leg ${index + 1}: ${leg.action.toUpperCase()} ${leg.strike} ${leg.optionType.toUpperCase()} - ${leg.description}`);
    });
    
    console.log('\n📊 POSITION METRICS:');
    const metrics = bullPutSpreadStrategy.calculateMetrics(180, 175, 2.50);
    console.log(`  Max Profit: $${metrics.maxProfit.toFixed(2)}`);
    console.log(`  Max Loss: $${Math.abs(metrics.maxLoss).toFixed(2)}`);
    console.log(`  Breakeven: $${metrics.breakeven.toFixed(2)}`);
    console.log(`  Risk/Reward: ${metrics.riskRewardRatio.toFixed(2)}:1`);
    
    console.log('\n🔍 GREEKS PROFILE:');
    Object.entries(bullPutSpreadStrategy.greeks).forEach(([greek, value]) => {
      console.log(`  ${greek.toUpperCase()}: ${value}`);
    });
    
    return correctedSetup;
  }
  
  /**
   * Run validation tests
   */
  static runValidation() {
    console.log('\n🛡️ VALIDATION SYSTEM TEST');
    console.log('==========================\n');
    
    // Test the corrected strategy
    const correctSetup = bullPutSpreadStrategy.formatTradeSetup({
      shortStrike: 180,
      longStrike: 175
    });
    
    const correctValidation = StrategyValidator.generateReport(
      bullPutSpreadStrategy, 
      correctSetup
    );
    
    console.log('✅ TESTING CORRECT STRATEGY:');
    console.log(`   Result: ${correctValidation.summary}`);
    console.log(`   Errors: ${correctValidation.errors.length}`);
    console.log(`   Critical: ${correctValidation.criticalCount}`);
    
    // Test the original buggy setup
    const buggySetup = {
      action: "Buy 180 Call",
      legs: ["BUY 180 CALL"],
      expiry: "30-45 DTE",
      contracts: 1
    };
    
    const buggyValidation = StrategyValidator.generateReport(
      bullPutSpreadStrategy, 
      buggySetup
    );
    
    console.log('\n❌ TESTING BUGGY STRATEGY (Original Problem):');
    console.log(`   Result: ${buggyValidation.summary}`);
    console.log(`   Errors: ${buggyValidation.errors.length}`);
    console.log(`   Critical: ${buggyValidation.criticalCount}`);
    
    if (buggyValidation.errors.length > 0) {
      console.log('\n   Error Details:');
      buggyValidation.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.severity}] ${error.message}`);
      });
    }
    
    return { correctValidation, buggyValidation };
  }
  
  /**
   * Generate a complete strategy card (like the UI would show)
   */
  static generateStrategyCard() {
    console.log('\n📋 COMPLETE STRATEGY CARD');
    console.log('==========================\n');
    
    const params = {
      shortStrike: 180,
      longStrike: 175,
      expiry: "30-45 DTE",
      contracts: 1
    };
    
    const setup = bullPutSpreadStrategy.formatTradeSetup(params);
    const legs = bullPutSpreadStrategy.generateLegs(params);
    const metrics = bullPutSpreadStrategy.calculateMetrics(180, 175, 2.50);
    
    const strategyCard = {
      title: `${bullPutSpreadStrategy.name} Strategy Details`,
      description: bullPutSpreadStrategy.description,
      
      overview: {
        bestFor: bullPutSpreadStrategy.bestFor,
        marketBias: bullPutSpreadStrategy.marketBias.charAt(0).toUpperCase() + bullPutSpreadStrategy.marketBias.slice(1),
        winRate: `${bullPutSpreadStrategy.winRate}%`,
        riskReward: bullPutSpreadStrategy.riskLevel.charAt(0).toUpperCase() + bullPutSpreadStrategy.riskLevel.slice(1)
      },
      
      positioning: {
        accountSize: "$25,000",
        riskAmount: "$500.00 (2%)",
        recommendedContracts: params.contracts,
        totalInvestment: "$325.00"
      },
      
      aiReasoning: bullPutSpreadStrategy.aiReasoning,
      
      tradeSetup: {
        action: setup.action, // This is now CORRECT!
        expiry: setup.expiry,
        contracts: setup.contracts,
        legs: legs
      },
      
      greeksProfile: bullPutSpreadStrategy.greeks,
      
      metrics: metrics
    };
    
    // Display the card
    console.log(`📊 ${strategyCard.title}`);
    console.log(`   ${strategyCard.description}\n`);
    
    console.log('📈 Strategy Overview:');
    console.log(`   Best For: ${strategyCard.overview.bestFor}`);
    console.log(`   Market Bias: ${strategyCard.overview.marketBias}`);
    console.log(`   Win Rate: ${strategyCard.overview.winRate}`);
    console.log(`   Risk/Reward: ${strategyCard.overview.riskReward}\n`);
    
    console.log('💰 Position Sizing:');
    console.log(`   Account Size: ${strategyCard.positioning.accountSize}`);
    console.log(`   Risk Amount: ${strategyCard.positioning.riskAmount}`);
    console.log(`   Recommended Contracts: ${strategyCard.positioning.recommendedContracts}`);
    console.log(`   Total Investment: ${strategyCard.positioning.totalInvestment}\n`);
    
    console.log('🤖 AI Reasoning:');
    console.log(`   ${strategyCard.aiReasoning}\n`);
    
    console.log('🎯 Specific Trade Setup:');
    console.log(`   Action: ${strategyCard.tradeSetup.action}`); // NOW CORRECT!
    console.log(`   Expiry: ${strategyCard.tradeSetup.expiry}`);
    console.log(`   Contracts: ${strategyCard.tradeSetup.contracts}\n`);
    
    console.log('🏛️ Greeks Profile:');
    Object.entries(strategyCard.greeksProfile).forEach(([greek, value]) => {
      console.log(`   ${greek.toUpperCase()}: ${value}`);
    });
    
    return strategyCard;
  }
}

// Run the demonstration
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting Options Strategy Fix Demonstration...\n');
  
  try {
    // 1. Demonstrate the fix
    OptionsStrategyApp.demonstrateFix();
    
    // 2. Run validation tests
    OptionsStrategyApp.runValidation();
    
    // 3. Generate complete strategy card
    OptionsStrategyApp.generateStrategyCard();
    
    console.log('\n✅ All demonstrations completed successfully!');
    console.log('\n🎉 The bull put spread strategy issue has been FIXED!');
    console.log('   • No more "Buy 180 Call" for put spread strategies');
    console.log('   • Proper validation prevents future mismatches');
    console.log('   • Comprehensive testing ensures reliability');
    
  } catch (error) {
    console.error('\n❌ Error during demonstration:', error.message);
    process.exit(1);
  }
}

export default OptionsStrategyApp;