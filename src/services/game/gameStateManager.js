// src/services/game/gameStateManager.js
class GameStateManager {
    static checkVictoryConditions(kingdom) {
      if (kingdom.economy >= 100 && kingdom.happiness >= 90 && kingdom.population >= 5000) {
        return {
          isVictory: true,
          message: "Economic Victory! Your kingdom has become a prosperous paradise!"
        };
      }
  
      if (kingdom.military >= 100 && kingdom.population >= 3000) {
        return {
          isVictory: true,
          message: "Military Victory! Your kingdom has become a mighty empire!"
        };
      }
  
      return { isVictory: false };
    }
  
    static checkDefeatConditions(kingdom) {
      const defeats = [];
  
      if (kingdom.happiness <= 0) {
        defeats.push("Your people have completely lost faith in your leadership. A rebellion has overthrown your rule!");
      }
  
      if (kingdom.economy <= 0) {
        defeats.push("The kingdom's treasury is empty. Economic collapse has led to widespread chaos!");
      }
  
      if (kingdom.military <= 0) {
        defeats.push("With no military force remaining, your kingdom has been conquered by neighboring powers!");
      }
  
      if (kingdom.population <= 0) {
        defeats.push("Your kingdom has been completely depopulated. The once-great realm is now a ghost kingdom!");
      }
  
      return {
        isDefeated: defeats.length > 0,
        messages: defeats
      };
    }
  
    static getGameState(kingdom, turn) {
      const victory = this.checkVictoryConditions(kingdom);
      if (victory.isVictory) {
        return {
          isGameOver: true,
          victory: true,
          message: victory.message,
          turns: turn
        };
      }
  
      const defeat = this.checkDefeatConditions(kingdom);
      if (defeat.isDefeated) {
        return {
          isGameOver: true,
          victory: false,
          message: defeat.messages.join("\n"),
          turns: turn
        };
      }
  
      // Game continues - check for warnings
      const warnings = [];
      if (kingdom.happiness <= 20) warnings.push("Warning: Civil unrest is reaching dangerous levels!");
      if (kingdom.economy <= 20) warnings.push("Warning: The treasury is running dangerously low!");
      if (kingdom.military <= 20) warnings.push("Warning: Your military forces are critically weakened!");
      if (kingdom.population <= 200) warnings.push("Warning: Population is reaching critical levels!");
  
      return {
        isGameOver: false,
        warnings
      };
    }
  }
  
  export default GameStateManager;