import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../lib/context/NotificationContext';

export interface ConnectionStatusProps {
  showDetails?: boolean;
  onRetry?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showDetails = false,
  onRetry
}) => {
  const {
    isConnected,
    isConnecting,
    connectionError,
    connect
  } = useNotifications();

  console.log('ConnectionStatus props:', { isConnected, isConnecting, connectionError });

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      connect();
    }
  };

  const getStatusInfo = () => {
    if (isConnecting) {
      return {
        text: 'Connecting...',
        color: '#f59e0b',
        emoji: '🔄'
      };
    } else if (isConnected) {
      return {
        text: 'Connected',
        color: '#10b981',
        emoji: '✅'
      };
    } else {
      return {
        text: 'Disconnected',
        color: '#ef4444',
        emoji: '❌'
      };
    }
  };

  const status = getStatusInfo();

  if (!showDetails && isConnected) {
    return null; // Don't show when connected if details not requested
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusIndicator}>
          <Text style={styles.emoji}>{status.emoji}</Text>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
        
        {!isConnected && !isConnecting && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDetails && connectionError && (
        <Text style={styles.errorText}>
          {connectionError}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default ConnectionStatus;
