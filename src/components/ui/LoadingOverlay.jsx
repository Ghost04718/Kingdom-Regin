// src/components/ui/LoadingOverlay.jsx
import { View, Flex, Text } from "@aws-amplify/ui-react";

const LoadingOverlay = ({ message = "Loading..." }) => {
  return (
    <View
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Flex
        direction="column"
        alignItems="center"
        gap="1rem"
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px'
        }}
      >
        <View
          className="loading-spinner"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid var(--amplify-colors-background-secondary)',
            borderTop: '3px solid var(--amplify-colors-brand-primary)',
            animation: 'spin 1s linear infinite'
          }}
        />
        <Text>{message}</Text>
      </Flex>
    </View>
  );
};

// Add loading spinner animation styles to index.css
const style = document.createElement('style');
style.textContent = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

export default LoadingOverlay;