// src/components/game/NotificationCenter.jsx
import { Alert, Flex } from "@aws-amplify/ui-react";

const NotificationCenter = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <Flex direction="column" gap="0.5rem">
      {notifications.map((notification, index) => (
        <Alert
          key={index}
          variation={notification.type === 'CRITICAL' ? "error" : "warning"}
          isDismissible={true}
          hasIcon={true}
          onDismiss={() => onDismiss(index)}
          marginBottom="0.5rem"
        >
          {notification.message}
        </Alert>
      ))}
    </Flex>
  );
};

export default NotificationCenter;