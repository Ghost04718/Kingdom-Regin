// src/components/game/GameMenu.jsx
import { 
    Menu, 
    MenuItem, 
    Divider,
    Button,
    Badge
  } from "@aws-amplify/ui-react";
  
  const GameMenu = ({ 
    onNewGame, 
    onSave, 
    onLoad, 
    onSettings, 
    onShowTutorial, 
    onShowStats,
    onSignOut,
    canSave = true 
  }) => {
    return (
      <Menu
        trigger={
          <Button variation="menu">
            Game Menu
          </Button>
        }
      >
        <MenuItem onClick={onShowStats}>
          Kingdom Statistics
        </MenuItem>
        
        <MenuItem onClick={onShowTutorial}>
          Tutorial
        </MenuItem>
  
        <Divider />
        
        <MenuItem 
          onClick={onSave}
          isDisabled={!canSave}
        >
          Save Game
        </MenuItem>
        
        <MenuItem onClick={onLoad} isDisabled>
          Load Game <Badge variation="info">Coming Soon</Badge>
        </MenuItem>
  
        <Divider />
        
        <MenuItem onClick={onSettings}>
          Settings
        </MenuItem>
        
        <MenuItem onClick={onNewGame}>
          New Game
        </MenuItem>
  
        <Divider />
        
        <MenuItem onClick={onSignOut}>
          Sign Out
        </MenuItem>
      </Menu>
    );
  };
  
  export default GameMenu;