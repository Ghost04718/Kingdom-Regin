// src/components/test/GameTest.jsx
import { useState } from 'react';
import {
  Button,
  Card,
  Flex,
  Text,
  Heading,
  View,
} from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";

const client = generateClient();

const GameTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [activeKingdom, setActiveKingdom] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [choiceResults, setChoiceResults] = useState(null);

  async function testCreateKingdom() {
    try {
      const { data: kingdom } = await client.models.Kingdom.create({
        name: "Test Kingdom",
        population: 1000,
        economy: 50,
        military: 30,
        happiness: 70,
        description: "Test kingdom for debugging",
      });
      
      setActiveKingdom(kingdom);
      return {
        name: "Create Kingdom",
        status: "SUCCESS",
        data: kingdom,
      };
    } catch (error) {
      return {
        name: "Create Kingdom",
        status: "FAILED",
        error: error.message,
      };
    }
  }

  async function testCreateResource(kingdomId) {
    try {
      const { data: resource } = await client.models.Resource.create({
        name: "Gold",
        quantity: 1000,
        type: "GOLD",
        kingdomId: kingdomId,
      });
      
      return {
        name: "Create Resource",
        status: "SUCCESS",
        data: resource,
      };
    } catch (error) {
      return {
        name: "Create Resource",
        status: "FAILED",
        error: error.message,
      };
    }
  }

  async function testCreateEvent(kingdomId) {
    try {
      const { data: event } = await client.models.Event.create({
        title: "Test Event",
        description: "Test event description",
        type: "INTERNAL",
        impact: JSON.stringify({ population: -10, economy: 5 }),
        choices: JSON.stringify([
          {
            text: "Accept Offer",
            impact: JSON.stringify({ economy: 10, happiness: 5 }),
          },
          {
            text: "Reject Offer",
            impact: JSON.stringify({ economy: -5, military: 5 }),
          }
        ]),
        kingdomId: kingdomId,
        timestamp: new Date().toISOString(),
      });
      
      setActiveEvent(event);
      return {
        name: "Create Event",
        status: "SUCCESS",
        data: event,
      };
    } catch (error) {
      return {
        name: "Create Event",
        status: "FAILED",
        error: error.message,
      };
    }
  }

  async function testEventChoice(choiceIndex = 0) {
    if (!activeKingdom || !activeEvent) {
      return {
        name: "Event Choice",
        status: "FAILED",
        error: "No active kingdom or event",
      };
    }

    try {
      const choices = JSON.parse(activeEvent.choices);
      const choice = choices[choiceIndex];
      const impact = JSON.parse(choice.impact);

      const { data: updatedKingdom } = await client.models.Kingdom.update({
        id: activeKingdom.id,
        economy: activeKingdom.economy + (impact.economy || 0),
        happiness: activeKingdom.happiness + (impact.happiness || 0),
        military: activeKingdom.military + (impact.military || 0),
      });

      setActiveKingdom(updatedKingdom);
      setChoiceResults({
        choice: choice.text,
        impact: impact,
        previousStats: activeKingdom,
        newStats: updatedKingdom
      });

      return {
        name: "Event Choice",
        status: "SUCCESS",
        data: {
          choice: choice.text,
          impact: impact,
          kingdom: updatedKingdom
        }
      };
    } catch (error) {
      return {
        name: "Event Choice",
        status: "FAILED",
        error: error.message,
      };
    }
  }

  async function runTests() {
    const results = [];
    
    const kingdomResult = await testCreateKingdom();
    results.push(kingdomResult);
    
    if (kingdomResult.status === "SUCCESS") {
      results.push(await testCreateResource(kingdomResult.data.id));
      results.push(await testCreateEvent(kingdomResult.data.id));
      results.push(await testEventChoice());
    }

    setTestResults(results);
  }

  async function cleanupTests() {
    try {
      const results = [];
      
      const { data: kingdoms } = await client.models.Kingdom.list();
      const { data: resources } = await client.models.Resource.list();
      const { data: events } = await client.models.Event.list();

      for (const kingdom of kingdoms) {
        await client.models.Kingdom.delete({ id: kingdom.id });
      }
      for (const resource of resources) {
        await client.models.Resource.delete({ id: resource.id });
      }
      for (const event of events) {
        await client.models.Event.delete({ id: event.id });
      }

      setActiveKingdom(null);
      setActiveEvent(null);
      setTestResults([{
        name: "Cleanup",
        status: "SUCCESS",
        description: `Deleted ${kingdoms.length} kingdoms, ${resources.length} resources, ${events.length} events`,
      }]);
    } catch (error) {
      setTestResults([{
        name: "Cleanup",
        status: "FAILED",
        error: error.message,
      }]);
    }
  }

  const EventChoiceDisplay = () => {
    if (!activeEvent) return null;

    try {
      const choices = JSON.parse(activeEvent.choices);
      return (
        <Card padding="1rem" marginTop="1rem">
          <Heading level={5}>Available Choices</Heading>
          <Flex direction="column" gap="1rem" marginTop="1rem">
            {choices.map((choice, index) => (
              <Button
                key={index}
                onClick={() => testEventChoice(index).then(r => setTestResults([r]))}
                variation="primary"
              >
                Choose: {choice.text}
              </Button>
            ))}
          </Flex>
          {choiceResults && (
            <View marginTop="1rem">
              <Text fontWeight="bold">Choice Results:</Text>
              <Text>Choice made: {choiceResults.choice}</Text>
              <Text>Impact:</Text>
              <pre style={{ fontSize: '0.8em' }}>
                {JSON.stringify(choiceResults.impact, null, 2)}
              </pre>
              <Text>Stats Change:</Text>
              <Flex gap="2rem">
                <View>
                  <Text fontWeight="bold">Before:</Text>
                  <pre style={{ fontSize: '0.8em' }}>
                    {JSON.stringify({
                      economy: choiceResults.previousStats.economy,
                      happiness: choiceResults.previousStats.happiness,
                      military: choiceResults.previousStats.military,
                    }, null, 2)}
                  </pre>
                </View>
                <View>
                  <Text fontWeight="bold">After:</Text>
                  <pre style={{ fontSize: '0.8em' }}>
                    {JSON.stringify({
                      economy: choiceResults.newStats.economy,
                      happiness: choiceResults.newStats.happiness,
                      military: choiceResults.newStats.military,
                    }, null, 2)}
                  </pre>
                </View>
              </Flex>
            </View>
          )}
        </Card>
      );
    } catch (error) {
      return (
        <Text color="red">Error parsing event choices: {error.message}</Text>
      );
    }
  };

  return (
    <Flex direction="column" gap="1rem">
      <Heading level={4}>Test Controls</Heading>
      
      <Flex gap="1rem">
        <Button onClick={runTests}>Run All Tests</Button>
        <Button onClick={cleanupTests} variation="destructive">
          Cleanup Test Data
        </Button>
      </Flex>

      <Card padding="1rem">
        <Heading level={5}>Individual Tests</Heading>
        <Flex gap="1rem" marginTop="1rem">
          <Button onClick={() => testCreateKingdom().then(r => setTestResults([r]))}>
            Test Create Kingdom
          </Button>
          <Button 
            onClick={() => activeKingdom && testCreateResource(activeKingdom.id).then(r => setTestResults([r]))}
            isDisabled={!activeKingdom}
          >
            Test Create Resource
          </Button>
          <Button 
            onClick={() => activeKingdom && testCreateEvent(activeKingdom.id).then(r => setTestResults([r]))}
            isDisabled={!activeKingdom}
          >
            Test Create Event
          </Button>
          <Button 
            onClick={() => testEventChoice().then(r => setTestResults([r]))}
            isDisabled={!activeKingdom || !activeEvent}
          >
            Test Event Choice
          </Button>
        </Flex>
      </Card>

      <Card padding="1rem">
        <Heading level={5}>Test Results</Heading>
        <Flex direction="column" gap="1rem" marginTop="1rem">
          {testResults.map((result, index) => (
            <Card 
              key={index}
              backgroundColor={result.status === "SUCCESS" ? "#e6ffe6" : "#ffe6e6"}
              padding="1rem"
            >
              <Text fontWeight="bold">{result.name}: {result.status}</Text>
              {result.error && <Text color="red">{result.error}</Text>}
              {result.description && <Text>{result.description}</Text>}
              {result.data && (
                <View marginTop="0.5rem">
                  <Text fontSize="0.8em" fontFamily="monospace">
                    {JSON.stringify(result.data, null, 2)}
                  </Text>
                </View>
              )}
            </Card>
          ))}
        </Flex>
      </Card>

      <Card padding="1rem">
        <Heading level={5}>Active Test State</Heading>
        <Flex direction="column" gap="1rem" marginTop="1rem">
          <Text>Active Kingdom: {activeKingdom ? activeKingdom.id : 'None'}</Text>
          {activeKingdom && (
            <View>
              <Text fontWeight="bold">Current Stats:</Text>
              <pre style={{ fontSize: '0.8em' }}>
                {JSON.stringify({
                  economy: activeKingdom.economy,
                  happiness: activeKingdom.happiness,
                  military: activeKingdom.military,
                }, null, 2)}
              </pre>
            </View>
          )}
          <Text>Active Event: {activeEvent ? activeEvent.id : 'None'}</Text>
          {activeEvent && (
            <View>
              <Text fontWeight="bold">Event Details:</Text>
              <Text>{activeEvent.title}</Text>
              <Text>{activeEvent.description}</Text>
            </View>
          )}
        </Flex>
        <EventChoiceDisplay />
      </Card>
    </Flex>
  );
};

export default GameTest;