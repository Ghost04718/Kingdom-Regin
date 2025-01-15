// src/components/game/SettingsPanel.jsx
import { useState } from 'react';
import { 
  Card,
  Flex,
  Button,
  Heading,
  Alert,
  RadioGroupField,
  SwitchField,
  Radio
} from "@aws-amplify/ui-react";

const SettingsPanel = ({ 
  initialSettings,
  onSave,
  onClose 
}) => {
  const [settings, setSettings] = useState(initialSettings || {
    difficulty: 'NORMAL',
    soundEnabled: true,
    musicEnabled: true,
    musicVolume: '70'
  });
  const [saveError, setSaveError] = useState(null);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      await onSave(settings);
      onClose();
    } catch (error) {
      setSaveError('Failed to save settings: ' + error.message);
    }
  };

  return (
    <Card variation="elevated" padding="2rem">
      <Flex direction="column" gap="1.5rem">
        <Heading level={3}>Game Settings</Heading>

        {saveError && (
          <Alert variation="error" isDismissible={true}>
            {saveError}
          </Alert>
        )}

        <RadioGroupField
          label="Difficulty"
          value={settings.difficulty}
          onChange={(e) => handleSettingChange('difficulty', e.target.value)}
          name="difficulty"
        >
          <Radio value="EASY">Easy</Radio>
          <Radio value="NORMAL">Normal</Radio>
          <Radio value="HARD">Hard</Radio>
        </RadioGroupField>

        <SwitchField
          label="Sound Effects"
          checked={settings.soundEnabled}
          onChange={e => handleSettingChange('soundEnabled', e.target.checked)}
        />

        <SwitchField
          label="Music"
          checked={settings.musicEnabled}
          onChange={e => handleSettingChange('musicEnabled', e.target.checked)}
        />

        <RadioGroupField
          label="Music Volume"
          value={settings.musicVolume}
          onChange={(e) => handleSettingChange('musicVolume', e.target.value)}
          name="volume"
        >
          <Radio value="0">Mute</Radio>
          <Radio value="25">25%</Radio>
          <Radio value="50">50%</Radio>
          <Radio value="75">75%</Radio>
          <Radio value="100">100%</Radio>
        </RadioGroupField>

        <Flex gap="1rem" justifyContent="flex-end">
          <Button onClick={onClose} variation="link">
            Cancel
          </Button>
          <Button onClick={handleSave} variation="primary">
            Save Settings
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

export default SettingsPanel;