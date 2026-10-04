import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, StyleSheet } from 'react-native';

import { theme } from '../theme';
import { DashboardScreen } from '../screens/DashboardScreen';
import { WalletsScreen } from '../screens/WalletsScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { AllocationEditorScreen } from '../screens/AllocationEditorScreen';
import { TransactionFormScreen } from '../screens/TransactionFormScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={[styles.iconText, { color }]}>{symbol}</Text>;
}

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: theme.fontWeight.bold },
        tabBarActiveTintColor: theme.colors.primaryBlue,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Personal Finance Ledger',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon symbol="⌂" color={color} />,
        }}
      />
      <Tab.Screen
        name="WalletsTab"
        component={WalletsScreen}
        options={{
          title: 'Wallets',
          headerTitle: 'Monthly Wallets',
          tabBarLabel: 'Wallets',
          tabBarIcon: ({ color }) => <TabIcon symbol="🂠" color={color} />,
        }}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsScreen}
        options={{
          title: 'Transactions',
          headerTitle: 'General Ledger',
          tabBarLabel: 'Ledger',
          tabBarIcon: ({ color }) => <TabIcon symbol="≡" color={color} />,
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
          headerTitle: 'Financial Insights',
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color }) => <TabIcon symbol="◔" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: theme.fontWeight.bold },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={BottomTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AllocationEditor"
          component={AllocationEditorScreen}
          options={{ title: 'Monthly Allocation' }}
        />
        <Stack.Screen
          name="TransactionForm"
          component={TransactionFormScreen}
          options={({ route }: any) => ({
            title: route.params?.transactionId ? 'Edit Transaction' : 'Add Transaction',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconText: {
    fontSize: 20,
    fontWeight: '700',
  },
});
