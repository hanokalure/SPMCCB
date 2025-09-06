import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabaseClient } from '../constants/Config';

interface NetworkTestProps {
  onClose: () => void;
  theme: 'light' | 'dark';
}

const NetworkTest: React.FC<NetworkTestProps> = ({ onClose, theme }) => {
  const [testResults, setTestResults] = useState<{
    basic: 'pending' | 'success' | 'failed';
    supabase: 'pending' | 'success' | 'failed';
    auth: 'pending' | 'success' | 'failed';
  }>({
    basic: 'pending',
    supabase: 'pending',
    auth: 'pending',
  });

  const [isRunning, setIsRunning] = useState(false);

  const colors = {
    background: theme === 'light' ? '#ffffff' : '#2d3748',
    text: theme === 'light' ? '#2d3748' : '#f7fafc',
    textSecondary: theme === 'light' ? '#718096' : '#a0aec0',
    accent: theme === 'light' ? '#3182ce' : '#63b3ed',
    border: theme === 'light' ? '#e2e8f0' : '#4a5568',
    success: '#38a169',
    error: '#e53e3e',
    warning: '#d69e2e',
  };

  const runNetworkTests = async () => {
    setIsRunning(true);
    setTestResults({
      basic: 'pending',
      supabase: 'pending',
      auth: 'pending',
    });

    // Test 1: Basic internet connectivity
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });
      setTestResults(prev => ({ ...prev, basic: 'success' }));
    } catch (error) {
      console.log('Basic connectivity test failed:', error);
      setTestResults(prev => ({ ...prev, basic: 'failed' }));
    }

    // Test 2: Supabase connectivity
    try {
      const response = await fetch(`${supabaseClient.supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseClient.supabaseKey,
        },
      });
      if (response.ok) {
        setTestResults(prev => ({ ...prev, supabase: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, supabase: 'failed' }));
      }
    } catch (error) {
      console.log('Supabase connectivity test failed:', error);
      setTestResults(prev => ({ ...prev, supabase: 'failed' }));
    }

    // Test 3: Auth endpoint
    try {
      const response = await fetch(`${supabaseClient.supabaseUrl}/auth/v1/health`, {
        method: 'GET',
        headers: {
          'apikey': supabaseClient.supabaseKey,
        },
      });
      if (response.ok) {
        setTestResults(prev => ({ ...prev, auth: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, auth: 'failed' }));
      }
    } catch (error) {
      console.log('Auth endpoint test failed:', error);
      setTestResults(prev => ({ ...prev, auth: 'failed' }));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'failed') => {
    switch (status) {
      case 'pending':
        return <Ionicons name="time-outline" size={20} color={colors.warning} />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color={colors.success} />;
      case 'failed':
        return <Ionicons name="close-circle" size={20} color={colors.error} />;
    }
  };

  const getStatusText = (status: 'pending' | 'success' | 'failed') => {
    switch (status) {
      case 'pending':
        return 'Testing...';
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
    }
  };

  const showDiagnosticInfo = () => {
    const info = `
Network Test Results:
• Basic Connectivity: ${getStatusText(testResults.basic)}
• Supabase Server: ${getStatusText(testResults.supabase)}
• Auth Endpoint: ${getStatusText(testResults.auth)}

Supabase URL: ${supabaseClient.supabaseUrl}

If you're seeing network failures:
1. Check your internet connection
2. Try switching between WiFi and mobile data
3. Check if your mobile carrier blocks certain domains
4. Try using a VPN
5. Contact your network administrator if on corporate network
    `;

    Alert.alert('Network Diagnostic Info', info, [{ text: 'OK' }]);
  };

  useEffect(() => {
    runNetworkTests();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Network Diagnostics</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.testItem}>
          {getStatusIcon(testResults.basic)}
          <Text style={[styles.testLabel, { color: colors.text }]}>Basic Internet</Text>
          <Text style={[styles.testStatus, { color: colors.textSecondary }]}>
            {getStatusText(testResults.basic)}
          </Text>
        </View>

        <View style={styles.testItem}>
          {getStatusIcon(testResults.supabase)}
          <Text style={[styles.testLabel, { color: colors.text }]}>Supabase Server</Text>
          <Text style={[styles.testStatus, { color: colors.textSecondary }]}>
            {getStatusText(testResults.supabase)}
          </Text>
        </View>

        <View style={styles.testItem}>
          {getStatusIcon(testResults.auth)}
          <Text style={[styles.testLabel, { color: colors.text }]}>Auth Endpoint</Text>
          <Text style={[styles.testStatus, { color: colors.textSecondary }]}>
            {getStatusText(testResults.auth)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={runNetworkTests}
          disabled={isRunning}
        >
          <Ionicons name="refresh" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>
            {isRunning ? 'Testing...' : 'Run Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.textSecondary }]}
          onPress={showDiagnosticInfo}
        >
          <Ionicons name="information-circle" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Show Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 400,
    borderRadius: 12,
    margin: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  testLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  testStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NetworkTest;
