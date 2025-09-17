# Pull Request: Fix P&L Calculation for Multi-Leg Options

## 🔧 P&L Calculation Fix

### Problem
Multi-leg option spreads were calculating P&L incorrectly, missing the 100x multiplier that accounts for each option contract representing 100 shares.

### Example Issue
- **User Input**: Buy $0.65 - Sell $0.15 = $0.50 net debit per contract
- **Expected P&L**: $0.50 profit per contract = $50.00 total (with 100x multiplier)
- **Previous (Incorrect)**: $0.50 total (missing 100x multiplier)
- **Fixed**: $50.00 total (correct with 100x multiplier)

### Changes Made
1. **Updated P&L Calculation for Multi-Leg Options**
   - Added 100x multiplier to credit spread P&L: `(entryPrice - exitPrice) * closeQty * 100`
   - Added 100x multiplier to debit spread P&L: `(exitPrice - entryPrice) * closeQty * 100`

2. **Updated Percentage Calculation**
   - Fixed percentage calculation to be consistent with the 100x multiplier
   - Formula: `(closePnl / (Math.abs(entryPrice) * closeQty * 100)) * 100`

3. **Added Comprehensive Test**
   - Created `test-spread-pnl-fix.html` to validate the fix
   - Tests both debit and credit spread scenarios
   - Verifies calculations match expected results

### Impact
- ✅ Option spreads now calculate P&L correctly
- ✅ Consistent with single option calculations
- ✅ Proper per-contract multiplier applied
- ✅ Maintains backward compatibility

### Testing
Run the test file `test-spread-pnl-fix.html` to verify the fix works correctly.

### Files Modified
- `app/page.js` - Updated P&L calculation logic AND added individual delete functionality
- `test-spread-pnl-fix.html` - New test file to validate the P&L fix
- `test-delete-functionality.html` - New test file to validate the delete functionality

## 🗑️ BONUS: Individual Trade Delete Feature

### Additional Enhancement Added
I've also added the individual trade delete functionality you requested:

#### New Delete Feature:
- ✅ **Individual Delete Buttons**: Each trade now has a red "🗑️ Delete" button
- ✅ **Confirmation Dialog**: Shows trade details before deletion to prevent accidents
- ✅ **Available for All Trades**: Works for both active and closed trades
- ✅ **Proper Cleanup**: Updates localStorage and recalculates portfolio analytics
- ✅ **Success Feedback**: Shows confirmation message after deletion

#### How It Works:
1. Click the red "🗑️ Delete" button next to any trade
2. Confirmation dialog shows trade details (symbol, type, quantity, status)
3. Confirm to permanently delete the trade
4. Portfolio updates automatically and shows success message

---

## Instructions for Creating the Pull Request

1. Go to: https://github.com/Renotrader31/AI-Options-Strategy-Generator/compare/main...genspark_ai_developer
2. Use the title: "fix(pnl) + feat(delete): P&L calculation fix + individual trade delete"
3. Copy the content above (excluding this instructions section) as the PR description
4. Create the pull request

The changes have been pushed to the `genspark_ai_developer` branch and are ready for review.