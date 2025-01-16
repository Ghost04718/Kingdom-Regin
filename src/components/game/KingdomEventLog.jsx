// src/components/game/KingdomEventLog.jsx
import {
    Card,
    Collection,
    Flex,
    Text,
    Heading,
    Badge,
    ScrollView,
    View,
    Divider,
    useTheme
  } from "@aws-amplify/ui-react";
  
  const EventLogEntry = ({ event, showDetails = false }) => {
    const { tokens } = useTheme();
  
    const getEventColor = (type) => {
      switch (type) {
        case 'CRITICAL': return tokens.colors.red[60];
        case 'WARNING': return tokens.colors.orange[60];
        case 'SUCCESS': return tokens.colors.green[60];
        case 'INFO': return tokens.colors.blue[60];
        default: return tokens.colors.neutral[60];
      }
    };
  
    const formatImpact = (impact) => {
      try {
        const impactObj = typeof impact === 'string' ? JSON.parse(impact) : impact;
        return Object.entries(impactObj).map(([key, value]) => (
          <Badge
            key={key}
            variation={value >= 0 ? "success" : "error"}
            marginRight="0.5rem"
          >
            {key}: {value >= 0 ? '+' : ''}{value}
          </Badge>
        ));
      } catch {
        return null;
      }
    };
  
    return (
      <Card
        variation="outlined"
        padding="1rem"
        backgroundColor={`${getEventColor(event.type)}10`}
        borderLeft={`4px solid ${getEventColor(event.type)}`}
      >
        <Flex direction="column" gap="0.5rem">
          <Flex justifyContent="space-between" alignItems="center">
            <Flex gap="0.5rem" alignItems="center">
              <Badge variation={event.type.toLowerCase()}>
                {event.type}
              </Badge>
              <Text fontWeight="bold">
                Turn {event.turn}
              </Text>
            </Flex>
            <Text fontSize="sm" color="font.secondary">
              {new Date(event.timestamp).toLocaleString()}
            </Text>
          </Flex>
  
          <Text>{event.title}</Text>
          
          {showDetails && (
            <>
              <Text fontSize="sm">{event.description}</Text>
              {event.impact && (
                <Flex gap="0.5rem" wrap="wrap">
                  {formatImpact(event.impact)}
                </Flex>
              )}
              {event.choice && (
                <View backgroundColor={tokens.colors.background.secondary} padding="0.5rem" borderRadius="medium">
                  <Text fontSize="sm" fontStyle="italic">
                    Choice made: {event.choice}
                  </Text>
                </View>
              )}
            </>
          )}
        </Flex>
      </Card>
    );
  };
  
  const KingdomEventLog = ({ events = [], filters = [] }) => {
    const filteredEvents = filters.length > 0
      ? events.filter(event => filters.includes(event.type))
      : events;
  
    return (
      <Card variation="elevated">
        <Flex direction="column" gap="1rem">
          <Heading level={4}>Kingdom Event Log</Heading>
          
          {filters.length > 0 && (
            <Flex gap="0.5rem" wrap="wrap">
              {filters.map(filter => (
                <Badge key={filter}>{filter}</Badge>
              ))}
            </Flex>
          )}
  
          <Divider />
  
          <ScrollView height="400px">
            <Collection
              type="list"
              items={filteredEvents}
              gap="0.5rem"
            >
              {(event) => (
                <EventLogEntry
                  key={event.id}
                  event={event}
                  showDetails={event.type !== 'INFO'}
                />
              )}
            </Collection>
            {filteredEvents.length === 0 && (
              <Text textAlign="center" color="font.secondary">
                No events to display
              </Text>
            )}
          </ScrollView>
        </Flex>
      </Card>
    );
  };
  
  export default KingdomEventLog;