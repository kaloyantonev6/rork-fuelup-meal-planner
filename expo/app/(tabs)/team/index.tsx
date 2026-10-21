import { View, StyleSheet } from "react-native";
import { Users } from "lucide-react-native";

import Colors from "@/constants/colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { ScreenHeader } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Team tab — placeholder only. The Team feature itself has not been built;
 * this screen just gives the tab button somewhere to land.
 */
export default function TeamScreen() {
  return (
    <View style={styles.container}>
      <ScreenBackground />
      <View style={styles.header}>
        <ScreenHeader title="Team" onBack={null} />
      </View>
      <View style={styles.body}>
        <EmptyState
          icon={<Users size={48} color={Colors.primary} />}
          title="Team"
          subtitle="Team features are on the way."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg0 },
  header: { paddingHorizontal: 16 },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 80 },
});
