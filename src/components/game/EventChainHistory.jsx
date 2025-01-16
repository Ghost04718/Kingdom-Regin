// src/components/game/EventChainHistory.jsx
import { useState } from 'react';
import {
  Card,
  Flex,
  Text,
  Button,
  View,
  Badge,
  Divider,
  Heading,
  ScrollView,
  useTheme,
  Icon
} from "@aws-amplify/ui-react";

const EventChainHistory = ({ chains = [], onChainSelect }) => {
  const [selectedChain, setSelectedChain] = useState(null);
  const { tokens } = useTheme();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChainTypeColor = (chainType) => {
    switch (chainType) {
      case 'DIPLOMATIC': return tokens.colors.blue[60];
      case 'CRISIS': return tokens.colors.red[60];
      case 'OPPORTUNITY': return tokens.colors.green[60];
      default: return tokens.colors.neutral[60];
    }
  };

  const getChainIcon = (chainType) => {
    switch (chainType) {
      case 'DIPLOMATIC':
        return (
          <Icon
            ariaLabel="Diplomatic"
            viewBox={{ width: 24, height: 24 }}
            paths={[
              {
                d: "M21 6h-4c0-2.2-1.8-4-4-4S9 3.8 9 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 0c0-1.1.9-2 2-2s2 .9 2 2h-4z"
              }
            ]}
          />
        );
      case 'CRISIS':
        return (
          <Icon
            ariaLabel="Crisis"
            viewBox={{ width: 24, height: 24 }}
            paths={[
              {
                d: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
              }
            ]}
          />
        );
      case 'OPPORTUNITY':
        return (
          <Icon
            ariaLabel="Opportunity"
            viewBox={{ width: 24, height: 24 }}
            paths={[
              {
                d: "M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"
              }
            ]}
          />
        );
      default:
        return null;
    }
  };

  const renderChainImpact = (impact) => {
    let impactObj;
    try {
      impactObj = typeof impact === 'string' ? JSON.parse(impact) : impact;
    } catch (error) {
      return null;
    }

    return (
      <Flex gap="0.5rem" flexWrap="wrap">
        {Object.entries(impactObj).map(([stat, value]) => (
          <Badge
            key={stat}
            variation={value >= 0 ? "success" : "error"}
          >
            {stat}: {value >= 0 ? '+' : ''}{value}
          </Badge>
        ))}
      </Flex>
    );
  };

  const renderChainSummary = (chain) => {
    if (!chain) return null;

    return (
      <Card padding="1rem">
        <Flex direction="column" gap="1rem">
          <Flex alignItems="center" gap="0.5rem">
            {getChainIcon(chain.chainType)}
            <Heading level={5}>{chain.trigger}</Heading>
          </Flex>
          
          <Divider />
          
          <View>
            <Text fontWeight="bold">Duration</Text>
            <Text>{formatDate(chain.startTime)} - {formatDate(chain.endTime)}</Text>
          </View>
          
          <View>
            <Text fontWeight="bold">Outcomes</Text>
            <ScrollView height="200px" padding="0.5rem">
              {chain.outcomes.map((outcome, index) => (
                <Card key={index} marginBottom="0.5rem">
                  <Text>Step {index + 1}: {outcome.choice.text}</Text>
                  {renderChainImpact(outcome.choice.impact)}
                </Card>
              ))}
            </ScrollView>
          </View>
          
          <View>
            <Text fontWeight="bold">Total Impact</Text>
            {renderChainImpact(chain.impact)}
          </View>
        </Flex>
      </Card>
    );
  };

  return (
    <Card>
      <Flex direction="column" gap="1rem">
        <Heading level={4}>Event Chain History</Heading>
        
        <Flex gap="1rem">
          <ScrollView 
            width="300px"
            height="400px"
            padding="0.5rem"
          >
            {chains.map((chain) => (
              <Card
                key={chain.id}
                onClick={() => setSelectedChain(chain)}
                padding="1rem"
                marginBottom="0.5rem"
                backgroundColor={selectedChain?.id === chain.id ? 
                  tokens.colors.brand.primary[10] : undefined}
                style={{ cursor: 'pointer' }}
              >
                <Flex direction="column" gap="0.5rem">
                  <Flex justifyContent="space-between" alignItems="center">
                    <Badge
                      backgroundColor={getChainTypeColor(chain.chainType)}
                      color="white"
                    >
                      {chain.chainType}
                    </Badge>
                    <Text fontSize="sm">
                      {formatDate(chain.startTime)}
                    </Text>
                  </Flex>
                  <Text fontWeight="bold">{chain.trigger}</Text>
                  <Text fontSize="sm">
                    {chain.outcomes.length} events
                  </Text>
                </Flex>
              </Card>
            ))}
          </ScrollView>
          
          <View flex="1">
            {selectedChain ? (
              renderChainSummary(selectedChain)
            ) : (
              <Card padding="1rem">
                <Text>Select an event chain to view details</Text>
              </Card>
            )}
          </View>
        </Flex>
      </Flex>
    </Card>
  );
};

export default EventChainHistory;