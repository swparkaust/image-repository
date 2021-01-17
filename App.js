import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { observer } from 'mobx-react';
import React from 'react';
import { Dimensions, Platform, StyleSheet, UIManager, View } from 'react-native';
import { withBadge } from 'react-native-elements';
// Import React Navigation
import { createAppContainer, NavigationActions } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';

import Stories from './components/stories';
// Import the screens
import FeedScreen from './screens/FeedScreen';
import InitScreen from './screens/InitScreen';
import NewPostScreen from './screens/NewPostScreen';
import ProfileScreen from './screens/ProfileScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import store from './stores/store';
import { AppFontLoader } from './utils/AppFontLoader';
import messages from './utils/messages';
import rules from './utils/rules';
import tabBarIcon from './utils/tabBarIcon';

// Create our main tab navigator for moving between the Feed and Profile screens
const navigator = createBottomTabNavigator(
  {
    // The name `Feed` is used later for accessing screens
    Feed: {
      // Define the component we will use for the Feed screen.
      screen: FeedScreen,
      navigationOptions: {
        // Add a cool Material Icon for this screen
        tabBarIcon: tabBarIcon('home'),
      },
    },
    // All the same stuff but for the Profile screen
    Profile: {
      screen: props => (
        <ProfileScreen {...props} rules={rules} messages={messages} deviceLocale="en" />
      ),
      navigationOptions: {
        tabBarIcon: tabBarIcon('face'),
      },
    },
  },
  {
    lazy: false,
    // We want to hide the labels and set a nice 2-tone tint system for our tabs
    tabBarOptions: {
      showLabel: false,
      activeTintColor: '#007AFF',
      inactiveTintColor: 'gray',
    },
  }
);

// Create the navigator that pushes high-level screens like the `NewPost` screen.
const stackNavigator = createStackNavigator(
  {
    Main: {
      screen: navigator,
      // Set the title for our app when the tab bar screen is present
      navigationOptions: { title: '', headerShown: false },
    },
    // This screen will not have a tab bar
    Init: InitScreen,
    NewPost: NewPostScreen,
    User: {
      screen: UserProfileScreen,
      navigationOptions: {
        title: '',
        headerBackTitleVisible: false,
        headerStyle: { shadowColor: 'transparent', elevation: 0 },
      },
    },
  },
  {
    initialRouteName: 'Init',
    mode: 'card',
    headerMode: 'screen',
    defaultNavigationOptions: {
      headerTintColor: '#007AFF',
      headerTitleStyle: { color: null },
      cardStyle: { backgroundColor: 'white' },
    },
  }
);

const AppContainer = createAppContainer(stackNavigator);

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Export it as the root component
@observer
export default class App extends React.Component {
  render() {
    const callNavigate = (routeName, params = {}) => {
      this.navigator.dispatch({
        type: NavigationActions.NAVIGATE,
        routeName,
        params,
      });
    };

    return (
      <ActionSheetProvider>
        <AppFontLoader>
          <AppContainer ref={nav => (this.navigator = nav)} />

          <View
            style={[
              styles.carouselWrap,
              { ...store.offset },
              store.carouselOpen ? styles.open : styles.closed,
            ]}>
            <Stories callNavigate={callNavigate} />
          </View>
        </AppFontLoader>
      </ActionSheetProvider>
    );
  }
}

const styles = StyleSheet.create({
  carouselWrap: {
    overflow: 'hidden',
    position: 'absolute',
  },
  closed: {
    width: 0,
    height: 0,
  },
  open: {
    width,
    height,
    top: 0,
    left: 0,
  },
});
