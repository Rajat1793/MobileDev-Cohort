import { View, Text } from 'react-native'
import React from 'react'
import { Button } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'

const HomeScreen = () => {
const navigation = useNavigation<any>()
  return (
    <View>
      <Text>HomeScreen</Text>
      <Button> GO to deatils tab</Button>
    </View>
  )
}

export default HomeScreen