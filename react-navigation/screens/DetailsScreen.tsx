import { View, Text } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { Button } from '@react-navigation/elements'


const DetailsScreen = () => {
    const navigation = useNavigation<any>()
  return (
    <View>
      <Text>DetailsScreen</Text>
    <Button onPress={() => navigation.navigate('Home')}>GO to home</Button>
    </View>
  )
}

export default DetailsScreen