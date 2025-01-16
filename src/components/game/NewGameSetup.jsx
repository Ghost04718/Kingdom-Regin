// src/components/game/NewGameSetup.jsx
import React, { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Card,
  Flex,
  Button,
  Text,
  Heading,
  RadioGroupField,
  Radio,
  TextField,
  Alert,
  View,
} from "@aws-amplify/ui-react";
import GameInitializer from '../../services/game/gameInitializer';
import LoadingOverlay from '../ui/LoadingOverlay';

const NewGameSetup = ({ onGameCreated }) => {
  const { user } = useAuthenticator();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    difficulty: 'NORMAL',
    preferences: {
      focus: 'BALANCED',
      startingStrategy: 'STANDARD'
    }
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePreferenceChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const startNewGame = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.username) {
        throw new Error('User not authenticated');
      }

      const gameInitializer = new GameInitializer();

      console.log('Starting game creation for user:', user.username);
      const result = await gameInitializer.initializeNewGame(user.username, settings);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create game');
      }

      if (!result.kingdom?.id) {
        throw new Error('Invalid kingdom data received');
      }

      console.log('Game created successfully:', result.kingdom);
      onGameCreated(result.kingdom);

    } catch (error) {
      console.error('Game creation error:', error);
      setError('Unable to create game: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card padding="2rem">
      {isLoading && <LoadingOverlay message="Creating your kingdom..." />}

      <Flex direction="column" gap="2rem">
        <Heading level={3}>Create New Kingdom</Heading>

        {error && (
          <Alert variation="error" isDismissible={true}>
            {error}
          </Alert>
        )}

        <View>
          <Heading level={5}>Difficulty</Heading>
          <RadioGroupField
            value={settings.difficulty}
            onChange={e => handleSettingChange('difficulty', e.target.value)}
            name="difficulty"
          >
            <Radio value="EASY">
              <Flex gap="1rem">
                <Text>Easy</Text>
                <Text fontSize="sm" color="font.secondary">
                  More resources, friendly events
                </Text>
              </Flex>
            </Radio>
            <Radio value="NORMAL">
              <Flex gap="1rem">
                <Text>Normal</Text>
                <Text fontSize="sm" color="font.secondary">
                  Balanced challenge
                </Text>
              </Flex>
            </Radio>
            <Radio value="HARD">
              <Flex gap="1rem">
                <Text>Hard</Text>
                <Text fontSize="sm" color="font.secondary">
                  Limited resources, challenging events
                </Text>
              </Flex>
            </Radio>
          </RadioGroupField>
        </View>

        <View>
          <Heading level={5}>Kingdom Focus</Heading>
          <RadioGroupField
            value={settings.preferences.focus}
            onChange={e => handlePreferenceChange('focus', e.target.value)}
            name="focus"
          >
            <Radio value="BALANCED">
              <Text>Balanced Development</Text>
            </Radio>
            <Radio value="ECONOMIC">
              <Text>Economic Focus</Text>
            </Radio>
            <Radio value="MILITARY">
              <Text>Military Focus</Text>
            </Radio>
            <Radio value="CULTURAL">
              <Text>Cultural Focus</Text>
            </Radio>
          </RadioGroupField>
        </View>

        <View>
          <Heading level={5}>Starting Strategy</Heading>
          <RadioGroupField
            value={settings.preferences.startingStrategy}
            onChange={e => handlePreferenceChange('startingStrategy', e.target.value)}
            name="startingStrategy"
          >
            <Radio value="STANDARD">
              <Text>Standard Start</Text>
            </Radio>
            <Radio value="AGGRESSIVE">
              <Text>Aggressive Expansion</Text>
            </Radio>
            <Radio value="DIPLOMATIC">
              <Text>Diplomatic Focus</Text>
            </Radio>
            <Radio value="ISOLATIONIST">
              <Text>Isolationist Development</Text>
            </Radio>
          </RadioGroupField>
        </View>

        <Flex justifyContent="space-between" alignItems="center">
          <Button
            onClick={() => window.history.back()}
            variation="link"
          >
            Back
          </Button>
          <Button
            onClick={startNewGame}
            variation="primary"
            size="large"
            isDisabled={isLoading}
          >
            Create Kingdom
          </Button>
        </Flex>

        {settings.difficulty === 'HARD' && (
          <Alert variation="warning">
            <Text>
              Hard difficulty provides a significant challenge. Resources are scarce, 
              events are more impactful, and mistakes can be costly.
            </Text>
          </Alert>
        )}
      </Flex>
    </Card>
  );
};

export default NewGameSetup;