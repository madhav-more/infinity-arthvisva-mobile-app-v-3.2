import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import EventScreen from '../screens/EventScreen';
import MoreScreen from '../screens/MoreScreen';
import theme from '../constants/theme';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.tabBarContainer}>
            <View style={[styles.tabBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12 }]}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    // Icon mapping
                    let iconName;
                    if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
                    else if (route.name === 'Events') iconName = isFocused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Explore') iconName = isFocused ? 'compass' : 'compass-outline';
                    else if (route.name === 'More') iconName = isFocused ? 'grid' : 'grid-outline';

                    return (
                        <TouchableOpacity
                            key={index}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.8}
                        >
                            <View style={styles.iconContainer}>
                                {isFocused ? (
                                    <LinearGradient
                                        colors={theme.colors.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.iconGradientMask}
                                    >
                                        <View style={styles.iconMaskInner}>
                                            <Ionicons name={iconName} size={22} color="#FFF" />
                                        </View>
                                    </LinearGradient>
                                ) : (
                                    <Ionicons name={iconName} size={24} color={theme.colors.textSecondary} />
                                )}
                            </View>

                            <Text style={[
                                styles.label,
                                isFocused ? styles.labelFocused : styles.labelInactive
                            ]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const AppTabs = () => {
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                lazy: true, // Optimize performance
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Events" component={EventScreen} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen name="More" component={MoreScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        backgroundColor: '#FFFFFF',
        // Top Shadow for integrated look
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 12,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 60, // Fixed height for tap area consistency
    },
    iconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    iconGradientMask: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconMaskInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
    },
    labelFocused: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    labelInactive: {
        color: theme.colors.textSecondary,
    },
});

export default AppTabs;
