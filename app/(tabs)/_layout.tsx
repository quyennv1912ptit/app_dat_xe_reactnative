import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

const TabLayout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#007AFF",
                headerShown: true
            }}
        >
            <Tabs.Screen name="index" options={{
                title: "Trang chủ",
                tabBarIcon: ({ color }) => <FontAwesome name="home" size={28} color={color} />
            }} />

            <Tabs.Screen name="activity" options={{
                title: "Hoạt động",
                tabBarIcon: ({ color }) => <FontAwesome name="list-alt" size={28} color={color} />
            }} />

            <Tabs.Screen name="message" options={{
                title: "Tin nhắn",
                tabBarIcon: ({ color }) => <FontAwesome name="commenting-o" size={28} color={color} />
            }} />

            <Tabs.Screen name="profile" options={{
                title: "Tài khoản",
                tabBarIcon: ({ color }) => <FontAwesome name="user-circle-o" size={28} color={color} />
            }} />
        </Tabs>
    )
};

export default TabLayout;