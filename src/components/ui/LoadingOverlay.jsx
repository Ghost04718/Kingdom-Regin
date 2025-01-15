// src/components/ui/LoadingOverlay.jsx
import { View, Flex, Text, Spinner } from "@aws-amplify/ui-react";

const LoadingOverlay = ({ message = "Loading..." }) => {
  return (
    <View
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      backgroundColor="rgba(0, 0, 0, 0.5)"
      zIndex="1000"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Flex
        direction="column"
        alignItems="center"
        gap="1rem"
        backgroundColor="white"
        padding="2rem"
        borderRadius="medium"
      >
        <Spinner size="large" />
        <Text>{message}</Text>
      </Flex>
    </View>
  );
};

export default LoadingOverlay;