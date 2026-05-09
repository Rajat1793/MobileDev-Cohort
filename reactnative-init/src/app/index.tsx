import { Image } from "expo-image";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Button, Switch, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

// This is a simple home screen component that demonstrates the use of various React Native components such as View, Text, Image, TextInput, and Pressable. It includes a long text with multiple lines, an external image, a text input field that updates the displayed text as the user types, and a pressable button that shows an alert when pressed. The styles are defined inline for simplicity, but they can be extracted to a separate StyleSheet for better organization.

// export default function HomeScreen() {
//   const [name, setName] = React.useState("");
//   return (
//     <View>
//       <Text>Home Screen</Text>
//       <Text numberOfLines={3}>
//         Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate quod suscipit rem beatae provident, voluptatibus, maiores consequuntur eligendi aliquid facilis accusamus est, ex vero numquam minus corrupti fugit eius harum?
//         Quidem architecto dolores odio. Excepturi magnam temporibus facilis ratione! Nam, blanditiis perferendis. Iusto voluptatibus odio, quia nemo vitae non corrupti vel ad sint, animi ut enim placeat nisi voluptatum assumenda?
//         Nihil mollitia qui minus repellat consequuntur tempora magni doloremque accusamus laborum sequi velit exercitationem aut dolores, nesciunt dolorem laboriosam quo temporibus assumenda rerum blanditiis omnis quis, quod impedit. Facilis, illo.
//         Mollitia deserunt itaque ipsum. Cum quasi voluptatibus nihil accusantium possimus, perspiciatis laboriosam dolorum praesentium, commodi quos sed minus odio ullam deserunt architecto quam in odit corrupti non. Quod, facere accusamus.
//         Similique repudiandae iure, obcaecati consequuntur aut possimus enim nesciunt autem laudantium, deserunt dignissimos molestiae architecto dolorem eum ipsam qui? Quisquam, saepe omnis? Sint dicta magnam beatae deleniti asperiores a sed.
//         Nostrum natus distinctio, nihil maxime veniam voluptates maiores dolores laudantium obcaecati tempora. Vero harum aspernatur in similique dolores eligendi reprehenderit aut, nam possimus, dolore magni velit corporis repudiandae doloremque incidunt?
//       Earum voluptatibus quidem repellat eligendi. Obcaecati beatae voluptas veniam vitae magnam. Veniam corrupti dolorem modi in aut, veritatis similique ipsa, dicta, quo corporis doloremque porro. Maiores unde fugit possimus at.
//       Totam commodi aperiam, necessitatibus dolore provident voluptatum, ipsum molestias tenetur asperiores sapiente sit voluptates nostrum reprehenderit adipisci tempore. Nobis distinctio quasi aut beatae alias. Et dolorem tempore odio recusandae commodi!
//       Accusamus vero obcaecati ratione. Sit quisquam corrupti accusantium quasi sunt, exercitationem debitis error voluptatibus adipisci laboriosam repellendus illum illo sed nihil culpa. Ipsam ratione sed ullam omnis sequi rerum est!
//       Perspiciatis laudantium esse pariatur fugit, blanditiis labore hic omnis tempora laboriosam, dolorum sunt tenetur molestias enim voluptate accusantium ratione rem. Repellat magnam, cum recusandae laboriosam officia nisi commodi et alias?
//       </Text>
//       {/* image tag and its best to define the size */}
//       {/* external image */}
//       <Image source="https://reactnative.dev/img/tiny_logo.png" style={{ width: 200, height: 200 }} />  
//       {/* local image */}
//       {/* <Image source={require("../../assets/images/icon.png")} style={{ width: 200, height: 200 }} /> */}

//       <TextInput
//         placeholder="Enter text"
//         style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginTop: 20 }}
//         onChangeText={setName}
//         value={name}
//         placeholderTextColor={"blue"}
//       />
//       <Text style={{ marginTop: 20 }}>You entered: {name}</Text>

//       <Pressable
//         onPress={() => {
//           alert("Button pressed");
//         }}
//         style={({ pressed }) => ({
//           marginTop: 20,
//           padding: 10,
//           backgroundColor: pressed ? "darkblue" : "blue"
//         })}
//         onLongPress={() => {
//         alert("Button long pressed");
//       }}
//       >
//         {({ pressed }) => pressed ? <Text style={{ color: "white" }}>Pressed!</Text> :
//         <Text style={{ color: "white" }}>Press Me</Text>
//       }
//       </Pressable>
//     </View>
//   );
// }

// This is a simple home screen component that demonstrates the use of various React Native components such as ScrollView, View, Text, Button, and Switch. It creates a list of items and displays them in a scrollable view, along with a button and a switch to interact with. The button shows an alert when pressed, and the switch toggles its state and changes its track color accordingly.
// const ScrollView = () => {
//   const items = Array.from({ length: 5 }, (_, i) => `Item ${i + 1}`);
//   const [isSwitchOn, setIsSwitchOn] = React.useState(false);
//   return (
//     <ScrollView style={{ flex: 1, padding: 20 }}
//       contentContainerStyle={{ paddingBottom: 20, alignItems: "center" }}>
//       {items.map((item, index) => (
//         <View
//           key={item}
//           style={{
//             backgroundColor: 'white',
//             padding: 16,
//             borderRadius: 10,
//             marginBottom: 10,
//             shadowColor: '#000',
//             shadowOpacity: 0.05,
//             shadowRadius: 4,
//             elevation: 2,
//           }}
//         >
//           <Text style={{ fontSize: 16 }}>{item}</Text>
//         </View>
//       ))}
//       <Button title ="I'm button" color="blue" onPress={() => alert("Button pressed")} />
//       <Switch value={isSwitchOn} onValueChange={(value) => setIsSwitchOn(value)} trackColor={{ false: "#adadad", true: "#00ff00" }} 
//       thumbColor={"yellow"}/>
//     </ScrollView>
//   );
// };

// export default ScrollView;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });


//FlatList
// const USERS = [
//   { id: '1', name: 'Alice Johnson', role: 'Designer' },
//   { id: '2', name: 'Bob Smith', role: 'Developer' },
//   { id: '3', name: 'Carol White', role: 'Manager' },
//   { id: '4', name: 'David Brown', role: 'Developer' },
//   { id: '5', name: 'Eve Davis', role: 'Designer' },
// ];
// const FlatLists = () => {
//   return (
//     <View style={styles.container}>
//       <Text>FlatList Component</Text>
//       <FlatList
//         data={USERS}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ padding: 20, backgroundColor: '#b82f2f', borderRadius: 10 }}
//         renderItem={({ item }) => (
//           <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
//             <Text>{item.name}</Text>
//             <Text>{item.role}</Text>
//           </View>
//         )}
//         ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#ccc' }} />}
//       />
//     </View>
//   );
// }
// export default FlatLists;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

// KeyboardAvoidingView
export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingComponent />
    </SafeAreaView>
  );
}

const KeyboardAvoidingComponent = () => {
  return (
    <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text>Keyboard Avoiding View</Text>
      <TextInput
        placeholder="Type something..."
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, width: '80%', marginTop: 20 }}
      />
    </KeyboardAvoidingView>
  )
}