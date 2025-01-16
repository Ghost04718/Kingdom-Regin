// src/App.jsx
import { useState, useEffect } from 'react';
import { Authenticator, useAuthenticator, withAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import {
  View,
  Heading,
  Button,
  Flex,
  Alert,
  Divider
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

import GameScreen from './components/game/GameScreen';
import NewGameSetup from './components/game/NewGameSetup';
import LoadingOverlay from './components/ui/LoadingOverlay';
import SettingsPanel from './components/game/SettingsPanel';
import ErrorBoundary from './components/ErrorBoundary';
import TutorialOverlay from './components/tutorial/TutorialOverlay';
import HelpButton from './components/tutorial/HelpButton';
import GameMenu from './components/game/GameMenu';
import KingdomStatsSummary from './components/game/KingdomStatsSummary';

const client = generateClient();

function MainMenu({ onNewGame, onSettings }) {
  return (
    <Flex direction="column" gap="2rem" padding="2rem" className="main-menu">
      <Heading level={1}>Kingdom's Reign: AI Chronicles</Heading>
      <Divider />
      <Flex direction="column" gap="1rem">
        <Button onClick={onNewGame} size="large" variation="primary">
          New Game
        </Button>
        <Button size="large" isDisabled>
          Load Game (Coming Soon)
        </Button>
        <Button onClick={onSettings} size="large">
          Settings
        </Button>
      </Flex>
    </Flex>
  );
}

function App() {
  const { user, signOut } = useAuthenticator();
  const [activeKingdom, setActiveKingdom] = useState(null);
  const [showNewGame, setShowNewGame] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kingdomHistory, setKingdomHistory] = useState([]);

  useEffect(() => {
    if (user) {
      loadUserKingdom();
    }
  }, [user]);

  // Keep track of kingdom history for stats
  useEffect(() => {
    if (activeKingdom) {
      setKingdomHistory(prev => {
        // Keep only last 12 turns for graph
        const newHistory = [...prev, {
          turn: activeKingdom.turn,
          population: activeKingdom.population,
          economy: activeKingdom.economy,
          military: activeKingdom.military,
          happiness: activeKingdom.happiness
        }].slice(-12);
        return newHistory;
      });
    }
  }, [activeKingdom]);

  const loadUserKingdom = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: kingdoms } = await client.models.Kingdom.list({
        filter: { owner: { eq: user.username } }
      });

      if (kingdoms && kingdoms.length > 0) {
        setActiveKingdom(kingdoms[0]);
      } else {
        setShowNewGame(false); // Show main menu instead
      }
    } catch (error) {
      console.error('Error loading kingdom:', error);
      setError('Failed to load kingdom data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewGame = () => {
    setShowNewGame(true);
    setActiveKingdom(null);
    setKingdomHistory([]);
  };

  const handleGameCreated = (kingdom) => {
    setActiveKingdom(kingdom);
    setShowNewGame(false);
    setShowTutorial(true);
    setKingdomHistory([]);
  };

  const handleSaveSettings = async (settings) => {
    try {
      // Handle settings save
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const GameContainer = () => {
    if (isLoading) {
      return <LoadingOverlay message="Loading kingdom..." />;
    }

    if (error) {
      return (
        <Alert variation="error">
          {error}
          <Button onClick={loadUserKingdom}>Retry</Button>
        </Alert>
      );
    }

    if (showNewGame) {
      return <NewGameSetup onGameCreated={handleGameCreated} />;
    }

    if (!activeKingdom) {
      return (
        <MainMenu 
          onNewGame={handleNewGame}
          onSettings={() => setShowSettings(true)}
        />
      );
    }

    return (
      <ErrorBoundary>
        <Flex direction="column" gap="2rem">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading level={3}>Kingdom's Reign</Heading>
            <Flex gap="1rem" alignItems="center">
              <HelpButton />
              <GameMenu 
                onNewGame={handleNewGame}
                onSettings={() => setShowSettings(true)}
                onShowTutorial={() => setShowTutorial(true)}
                onShowStats={() => setShowStats(true)}
                onSignOut={signOut}
              />
            </Flex>
          </Flex>

          {showSettings && (
            <SettingsPanel
              initialSettings={null}
              onSave={handleSaveSettings}
              onClose={() => setShowSettings(false)}
            />
          )}

          {showTutorial && (
            <TutorialOverlay 
              visible={showTutorial}
              onComplete={() => setShowTutorial(false)}
            />
          )}

          {showStats && (
            <Alert
              title="Kingdom Statistics"
              isOpen={showStats}
              onClose={() => setShowStats(false)}
              size="large"
            >
              <KingdomStatsSummary 
                kingdom={activeKingdom}
                history={kingdomHistory}
              />
            </Alert>
          )}

          <GameScreen 
            kingdom={activeKingdom}
            onKingdomUpdate={setActiveKingdom}
          />
        </Flex>
      </ErrorBoundary>
    );
  };

  return (
    <View className="app-container">
      <GameContainer />
    </View>
  );
}

export default withAuthenticator(App, {
  loginMechanisms: ['email'],
  signUpAttributes: ['email'],
  socialProviders: []
});