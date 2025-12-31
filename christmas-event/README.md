# Christmas Event Cleanup Instructions

## When to Delete
Delete this folder on **January 6, 2026** (or when event ends)

## How to Delete
1. Simply delete the entire `/christmas-event` folder
2. Remove the event activation code from `index.html`:
   - Delete the `<script>` block that checks for Christmas event dates (around lines 16-30)
3. Clear localStorage (optional):
   ```javascript
   localStorage.removeItem('christmas_challenges');
   localStorage.removeItem('christmas_leaderboard');
   localStorage.removeItem('christmas_achievements');
   localStorage.removeItem('christmas_last_date');
   ```
4. Test that regular game still works
5. Done! No other changes needed.

## What Gets Removed
- Santa bird sprites
- Candy cane pipes
- Snowfall effects
- Christmas sounds
- Holiday UI theme
- Special power-ups
- Christmas achievements
- Event leaderboard
- Present collectibles
- Combo system enhancements

## What Stays
- Original game mechanics
- Regular high scores
- Standard assets
- Core game files
- All existing functionality

## Backup (Optional)
If you want to save the Christmas event for next year:
1. Zip the `/christmas-event` folder
2. Store somewhere safe
3. Can re-use next year by updating dates in `christmas-config.json`!

---

**Built by Adi** (adi.binsheraz@gmail.com)  
Merry Christmas! 🎄🎅❄️
