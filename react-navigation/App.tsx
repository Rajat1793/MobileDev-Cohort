import * as React from 'react';
import { View, Text } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';

const  Stack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
    Details:DetailsScreen,
  }
});

const Navigation = createNativeStackNavigator
const App = () => {
  return (
    <Navigation>
      <Stack />
    </Navigation>
  );
};

export default App;
