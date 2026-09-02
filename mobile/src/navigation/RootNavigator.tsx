import React from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuth } from '../auth/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import VariantsListScreen from '../screens/VariantsListScreen';
import VariantDetailScreen from '../screens/VariantDetailScreen';
import AccessDeniedScreen from '../screens/AccessDeniedScreen';
import AddVariantScreen from '../screens/AddVariantScreen';
import OutListScreen from '../screens/OutListScreen';
import CreateOutScreen from '../screens/CreateOutScreen';
import OutDetailScreen from '../screens/OutDetailScreen';
import CreateInScreen from '../screens/CreateInScreen';
import InDetailScreen from '../screens/InDetailScreen';
import PartnersScreen from '../screens/PartnersScreen';
import { colors } from '../theme';

export type RootStackParamList = {
  Login: undefined;
  AccessDenied: undefined;
  Variants: undefined;
  VariantDetail: { id: string; title?: string };
  AddVariant: undefined;
  OutList: undefined;
  CreateOut: undefined;
  OutDetail: { id: string };
  CreateIn: undefined;
  InDetail: { id: string };
  Partners: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'smartcelladmin://'],
  config: {
    screens: {
      Login: 'login',
      Variants: 'variants',
      AddVariant: 'add-variant',
      VariantDetail: 'variants/:id',
      OutList: 'outs',
      CreateOut: 'outs/new',
      OutDetail: 'outs/:id',
      CreateIn: 'in/new',
      InDetail: 'in/:id',
      Partners: 'partners',
    },
  },
};

export default function RootNavigator() {
  const { session, loading, access, isAdminish } = useAuth();

  // Initial session restore, or verifying permissions for a fresh session.
  if (loading || (session && (access === 'unknown' || access === 'checking'))) {
    return (
      <View style={styles.center}>
        <Text style={styles.splashLogo}>SmartCell</Text>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.splashHint}>Getting your shop ready…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName={
          session && access === 'granted' ? (isAdminish ? 'Variants' : 'OutList') : undefined
        }
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        {session && access === 'granted' ? (
          <>
            {isAdminish ? (
              <>
                <Stack.Screen
                  name="Variants"
                  component={VariantsListScreen}
                  options={({ navigation }) => ({
                    title: 'Variants',
                    headerRight: () => (
                      <View style={{ flexDirection: 'row', gap: 18 }}>
                        <TouchableOpacity
                          testID="nav-outs-button"
                          onPress={() => navigation.navigate('OutList')}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
                            Outs
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          testID="add-variant-button"
                          onPress={() => navigation.navigate('AddVariant')}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
                            + Add
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ),
                  })}
                />
                <Stack.Screen
                  name="VariantDetail"
                  component={VariantDetailScreen}
                  options={({ route }) => ({ title: route.params?.title ?? 'Variant' })}
                />
                <Stack.Screen
                  name="AddVariant"
                  component={AddVariantScreen}
                  options={{ title: 'Add variant' }}
                />
                <Stack.Screen name="CreateIn" component={CreateInScreen} options={{ title: 'Take a device IN' }} />
              </>
            ) : null}
            <Stack.Screen
              name="OutList"
              component={OutListScreen}
              options={({ navigation }) => ({
                title: 'Out Devices',
                headerRight: () => (
                  <TouchableOpacity
                    testID="nav-partners-button"
                    onPress={() => navigation.navigate('Partners')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>Partners</Text>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen name="CreateOut" component={CreateOutScreen} options={{ title: 'OUT devices' }} />
            <Stack.Screen name="OutDetail" component={OutDetailScreen} options={{ title: 'OUT detail' }} />
            <Stack.Screen name="InDetail" component={InDetailScreen} options={{ title: 'IN detail' }} />
            <Stack.Screen name="Partners" component={PartnersScreen} options={{ title: 'Partners & shops' }} />
          </>
        ) : session && access === 'denied' ? (
          <Stack.Screen
            name="AccessDenied"
            component={AccessDeniedScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: 14 },
  splashLogo: { fontSize: 30, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  splashHint: { fontSize: 13, color: colors.textMuted },
});
