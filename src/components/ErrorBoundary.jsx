// src/components/ErrorBoundary.jsx
import React from 'react';
import { Alert, Button, Heading, Text, Flex } from "@aws-amplify/ui-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variation="error">
          <Flex direction="column" gap="1rem">
            <Heading level={3}>Something went wrong</Heading>
            <Text>{this.state.error?.message}</Text>
            <Button onClick={() => window.location.reload()}>
              Reload Game
            </Button>
          </Flex>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;