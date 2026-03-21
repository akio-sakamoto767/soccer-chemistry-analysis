# Testing Guide: Chemistry Strategy System

**Date:** March 21, 2026  
**Purpose:** Comprehensive testing guide to verify all chemistry strategy features work correctly

---

## Pre-Testing Setup

### 1. Restart Backend
```bash
cd soccer-chemistry-analysis/backend
python flask_app.py
```

**Expected Output:**
```
INFO:__main__:Starting Flask app on port 8000
INFO:services.data_loader:Loading data from local path: D:/soccer-chemistry-analysis/soccer-chemistry-analysis/data
INFO:services.data_loader:✅ Loaded 713,114 players from CSV
INFO:services.data_loader:✅ Successfully enriched 713,114 players
```

### 2. Verify Frontend is Running
```bash
cd soccer-chemistry-analysis/frontend
npm run dev
```

**Expected:** Frontend accessible at `http://95.217.85.62:5173`

### 3. Navigate to Team Network Page
Open browser → Go to Team Chemistry Network page

---

## Test Suite

### Test 1: Strategy-Specific Player Selection ⭐ CRITICAL

**Objective:** Verify different strategies select different players

**Steps:**
1. Select formation: **4-3-3**
2. Select optimization strategy: **⚔️ Offensive**
3. Click **"Recommend Team"**
4. Wait for optimization (~3-4 seconds)
5. Note the selected players, especially:
   - Forward names
   - Midfielder names
   - Their positions (FWD/MID should dominate)
6. Click **"Reset Selection"**
7. Select optimization strategy: **🛡️ Defensive**
8. Click **"Recommend Team"**
9. Compare the new players

**Expected Results:**
- ✅ Different players selected (at least 6-8 different)
- ✅ Offensive team has more FWD/MID players
- ✅ Defensive team has more DEF/GKP players
- ✅ Player names are different between strategies

**If Failed:**
- Check backend logs for work rate data
- Verify `work_rate_attack` and `work_rate_defense` fields exist
- Check if pool creation is using strategy-specific sorting

---

### Test 2: Chemistry Type Auto-Sync ⭐ CRITICAL

**Objective:** Verify Chemistry Type dropdown syncs with Recommend Team strategy

**Steps:**
1. Manually set "Chemistry Type (Visualization)" to **"Average Chemistry"**
2. Select optimization strategy: **⚔️ Offensive**
3. Click **"Recommend Team"**
4. Observe the "Chemistry Type (Visualization)" dropdown

**Expected Results:**
- ✅ Dropdown automatically changes to **"Offensive Chemistry"**
- ✅ Visualization shows offensive chemistry values
- ✅ No manual dropdown change needed

**Repeat for:**
- Balanced → Should set to "Average Chemistry"
- Defensive → Should set to "Defensive Chemistry"

**If Failed:**
- Check `handleRecommendTeam()` function
- Verify `viewModeMap` is correctly mapping strategies
- Check if `setViewMode()` is being called

---

### Test 3: Chemistry Values Change with Type ⭐ CRITICAL

**Objective:** Verify chemistry scores change when switching chemistry types

**Steps:**
1. Use any recommended team (or manually select 11 players)
2. Ensure team is visualized
3. Note the **"Average Chemistry"** value (e.g., 68.5)
4. Note the **"Strongest Partnerships"** top score (e.g., 70.1)
5. Change "Chemistry Type (Visualization)" to **"Offensive Chemistry"**
6. Wait for recalculation
7. Note the new values

**Expected Results:**
- ✅ Average Chemistry value changes (e.g., 68.5 → 72.3)
- ✅ Strongest Partnerships scores change (e.g., 70.1 → 75.8)
- ✅ Partnership rankings may change
- ✅ Values are different for each chemistry type

**Test All Three Types:**
| Chemistry Type | Expected Behavior |
|----------------|-------------------|
| Offensive | Higher scores for FWD-MID pairs |
| Average | Balanced scores across all pairs |
| Defensive | Higher scores for DEF-GK pairs |

**If Failed:**
- Check `/api/chemistry/team` endpoint
- Verify `chemistry_type` parameter is being used
- Check if conditional logic selects correct chemistry value

---

### Test 4: Strongest Partnerships Reflect Strategy

**Objective:** Verify top partnerships match the selected strategy

**Steps:**
1. Select optimization strategy: **⚔️ Offensive**
2. Click **"Recommend Team"**
3. Wait for auto-visualization
4. Check **"Strongest Partnerships"** section
5. Note the position codes (FWD, MID, DEF, GKP)

**Expected Results for Offensive:**
- ✅ Top 3 partnerships include FWD-MID or MID-MID
- ✅ Few or no DEF-GK partnerships in top 5
- ✅ Chemistry scores reflect offensive play style

**Repeat for Defensive:**
- ✅ Top 3 partnerships include DEF-DEF or DEF-GK
- ✅ Few or no FWD-FWD partnerships in top 5
- ✅ Chemistry scores reflect defensive play style

**If Failed:**
- Check if correct players are being selected
- Verify chemistry calculations use strategy-specific bonuses
- Check role-based chemistry bonuses in optimizer

---

### Test 5: Consistency Check

**Objective:** Verify same strategy produces same results (deterministic)

**Steps:**
1. Select optimization strategy: **⚖️ Balanced**
2. Click **"Recommend Team"**
3. Note all 11 player names
4. Click **"Reset Selection"**
5. Select optimization strategy: **⚖️ Balanced** (same)
6. Click **"Recommend Team"**
7. Compare player names

**Expected Results:**
- ✅ Exact same 11 players selected
- ✅ Same order
- ✅ Same chemistry values
- ✅ Deterministic behavior (no randomness)

**If Failed:**
- Check if randomization was accidentally left in code
- Verify pool creation is deterministic
- Check if greedy algorithm has any random elements

---

### Test 6: Formation Compatibility

**Objective:** Verify strategies work with all formations

**Test Each Formation:**
- 4-3-3
- 4-4-2
- 4-2-3-1
- 3-5-2
- 3-4-3

**For Each Formation:**
1. Select formation
2. Select **Offensive** strategy
3. Click **"Recommend Team"**
4. Verify 11 players selected
5. Verify positions match formation requirements

**Expected Results:**
- ✅ All formations work
- ✅ Correct number of players per position
- ✅ No errors or missing players

**If Failed:**
- Check formation mapping in `create_squad_pool()`
- Verify position requirements are correct
- Check if enough players exist for each position

---

### Test 7: Performance Check

**Objective:** Verify optimization completes within acceptable time

**Steps:**
1. Select any formation
2. Select any strategy
3. Start timer
4. Click **"Recommend Team"**
5. Stop timer when players appear

**Expected Results:**
- ✅ Optimization completes in < 5 seconds
- ✅ No timeout errors
- ✅ Smooth user experience

**If Failed:**
- Check pool size (should be ~100 players)
- Verify greedy algorithm is being used (not brute force)
- Check for infinite loops or performance issues

---

### Test 8: Edge Cases

**Objective:** Verify system handles edge cases gracefully

**Test Cases:**

#### 8.1: Low Rating Threshold
1. Modify min_rating to 50 (if possible via UI)
2. Click **"Recommend Team"**
3. **Expected:** Still selects 11 players, lower quality

#### 8.2: High Rating Threshold
1. Modify min_rating to 90 (if possible)
2. Click **"Recommend Team"**
3. **Expected:** May have fewer high-rated players, auto-lowers threshold

#### 8.3: Rapid Strategy Switching
1. Click **Offensive** → **"Recommend Team"**
2. Immediately click **Defensive** → **"Recommend Team"**
3. Repeat 5 times rapidly
4. **Expected:** No errors, each request completes correctly

#### 8.4: Manual Selection + Chemistry Type Change
1. Manually select 11 players
2. Click **"Visualize Team"**
3. Change chemistry type multiple times
4. **Expected:** Values update each time, no errors

---

## Debugging Checklist

If tests fail, check these common issues:

### Backend Issues
- [ ] Backend is running on port 8000
- [ ] Data loaded successfully (713,114 players)
- [ ] Work rate fields exist in player data
- [ ] No errors in backend console
- [ ] `/api/recommend-team` endpoint responds
- [ ] `/api/chemistry/team` endpoint responds

### Frontend Issues
- [ ] Frontend is running on port 5173
- [ ] No console errors in browser
- [ ] API calls reaching backend (check Network tab)
- [ ] State updates correctly (check React DevTools)
- [ ] Chemistry Type dropdown updates

### Data Issues
- [ ] `player_attributes_general.csv` has work_rate columns
- [ ] Players have `work_rate_attack` and `work_rate_defense` fields
- [ ] Data enrichment completed successfully
- [ ] Player lookup dictionary populated

---

## Expected Console Output

### Backend Console (Success)
```
INFO:__main__:Recommending team: formation=4-3-3, chemistry_type=offensive, min_rating=70
INFO:__main__:Creating squad pool: 20 players per position, chemistry_type=offensive
INFO:__main__:Added 20 FWD players to pool (avg rating: 82.3, strategy: offensive)
INFO:__main__:Added 20 MID players to pool (avg rating: 81.7, strategy: offensive)
INFO:__main__:Squad pool created: 80 total players (strategy-optimized for offensive)
INFO:services.squad_optimizer:Starting greedy optimization: maximize=True, weight=0.7
INFO:services.squad_optimizer:Position 1 (GK): 20 candidates
INFO:services.squad_optimizer:Selected: Player X (score: 110.0)
...
INFO:__main__:Optimization complete: 11 players, avg_chemistry=68.53
```

### Frontend Console (Success)
```
=== Recommending Team (Chemistry-Optimized) ===
Formation: 4-3-3
Chemistry Type: offensive
Recommended players: 11
Optimization metadata: {chemistry_type: "offensive", weight: 0.7, ...}
Setting viewMode to: offensive
Auto-visualizing recommended team with chemistry type: offensive
=== Team Chemistry Response ===
Response data: {total_chemistry: 3769.15, average_chemistry: 68.53, ...}
```

---

## Success Criteria

All tests must pass for the feature to be considered complete:

- ✅ Test 1: Different players for different strategies
- ✅ Test 2: Chemistry Type auto-syncs
- ✅ Test 3: Chemistry values change with type
- ✅ Test 4: Partnerships reflect strategy
- ✅ Test 5: Deterministic results
- ✅ Test 6: All formations work
- ✅ Test 7: Performance < 5 seconds
- ✅ Test 8: Edge cases handled

---

## Reporting Issues

If any test fails, report with:
1. Test number and name
2. Steps to reproduce
3. Expected vs actual result
4. Backend console output
5. Frontend console output
6. Browser and version

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Mark feature as complete
2. ✅ Update documentation
3. ✅ Deploy to production (if applicable)
4. ✅ Monitor user feedback
5. ✅ Consider future enhancements

---

## Future Enhancements (Optional)

After core functionality is verified:
- Add work rate display in player cards
- Add chemistry type explanation tooltips
- Add "Compare Strategies" feature
- Add save/load team functionality
- Add export team to CSV/JSON
- Add team sharing via URL
