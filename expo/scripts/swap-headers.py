"""One-off: swap bespoke back-button headers for the shared WHOOP-style ScreenHeader."""
import re, sys

JOBS = {
    "app/coach.tsx": ('title="AI Coach" subtitle="Food-first · Source-aware" onBack={() => router.back()}', None),
    "app/meal-times.tsx": ('title="Meal Times" subtitle="Eating windows" onBack={() => router.back()}', None),
    "app/nutrition-details.tsx": ('title="Nutrition" subtitle="Diet & cooking" onBack={() => router.back()}', None),
    "app/profile-details.tsx": ('title="Player Profile" subtitle="Body & football" onBack={() => router.back()}', None),
    "app/notifications.tsx": ('title="Notifications" onBack={() => router.back()}', "notif"),
}

NOTIF_RIGHT = '''
          right={
            unreadCount > 0 ? (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  void markAllRead();
                }}
                style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.7 }]}
                hitSlop={8}
              >
                <Text style={styles.markAllText}>Read all</Text>
              </Pressable>
            ) : null
          }'''

for path, (props, extra) in JOBS.items():
    s = open(path).read()
    m = re.search(r"^( *)<View style=\{\[styles\.header, \{ paddingTop: insets\.top \+ 8 \}\]\}>\n", s, re.M)
    if not m:
        print("no header", path); continue
    indent = m.group(1)
    close = s.index("\n" + indent + "</View>\n", m.end())
    end = close + len("\n" + indent + "</View>\n")
    right = NOTIF_RIGHT if extra == "notif" else ""
    block = (f"{indent}<View style={{{{ paddingHorizontal: 16, paddingTop: insets.top + 4 }}}}>\n"
             f"{indent}  <ScreenHeader\n{indent}    " + props.replace("} ", "}\n" + indent + "    ").replace('" ', '"\n' + indent + "    ") +
             right + f"\n{indent}  />\n{indent}</View>\n")
    s = s[:m.start()] + block + s[end:]
    if 'from "@/components/ui/Dashboard"' not in s:
        s = s.replace('import Colors from "@/constants/colors";\n',
                      'import Colors from "@/constants/colors";\nimport { ScreenHeader } from "@/components/ui/Dashboard";\n', 1)
    open(path, "w").write(s)
    print("ok", path)
