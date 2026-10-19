"""One-off: move favourites / saved plans / saved-plan detail / supplements onto the shared WHOOP header + palette."""
import re

def sub(s, a, b, path):
    assert a in s, (path, a[:60]); return s.replace(a, b)

DARK_NEW = '''const DARK = {
  bg: Colors.bg0,
  card: Colors.bg2,
  elevated: Colors.bg3,
  border: "rgba(255,255,255,0.06)",
  text: Colors.text,
  textSecondary: Colors.textSecondary,
  teal: Colors.primary,'''
IMPORTS = 'import Colors from "@/constants/colors";\nimport ScreenBackground from "@/components/ui/ScreenBackground";\nimport { ScreenHeader } from "@/components/ui/Dashboard";\n'

for path, title, chip in [("app/(tabs)/home/favorites.tsx", "Favourites", "filterChip"),
                          ("app/(tabs)/home/saved-plans.tsx", "Saved Plans", "folderChip")]:
    s = open(path).read()
    s = re.sub(r'const DARK = \{\n  bg: "#0F1115",\n  card: "#1A1D23",\n  elevated: "#242830",\n  border: "#2A2E38",\n  text: "#FFFFFF",\n  textSecondary: "#9CA3AF",\n  teal: "#2dd4a8",', DARK_NEW, s)
    s = s.replace('tealDark: "#1a9e7a",', 'tealDark: "#1FB98C",')
    s = s.replace('import EmptyState from "@/components/ui/EmptyState";\n', 'import EmptyState from "@/components/ui/EmptyState";\n' + IMPORTS, 1)
    m = re.search(r'    <View style=\{\[styles\.container, \{ paddingTop: insets\.top \}\]\}>\n      <View style=\{styles\.header\}>\n.*?\n      </View>\n', s, re.S)
    assert m, path
    s = s[:m.start()] + f'''    <View style={{[styles.container, {{ paddingTop: insets.top }}]}}>
      <ScreenBackground />
      <View style={{{{ paddingHorizontal: 16, paddingTop: 4 }}}}>
        <ScreenHeader title="{title}" onBack={{() => router.back()}} />
      </View>
''' + s[m.end():]
    s = sub(s, f'''  {chip}Active: {{
    backgroundColor: DARK.teal + "22",
    borderColor: DARK.teal,
  }},''', f'''  {chip}Active: {{
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  }},''', path)
    s = sub(s, f'''  {chip}TextActive: {{
    color: DARK.teal,
  }},''', f'''  {chip}TextActive: {{
    color: Colors.textInverse,
  }},''', path)
    s = sub(s, f'''  {chip}Text: {{
    fontSize: 13,
    fontWeight: "600" as const,''', f'''  {chip}Text: {{
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase" as const,''', path)
    if 'from "@/constants/design"' not in s:
        s = s.replace('import Colors from "@/constants/colors";\n', 'import Colors from "@/constants/colors";\nimport { fonts } from "@/constants/design";\n', 1)
    open(path, "w").write(s)
    print("ok", path)

# saved-plan-detail
path = "app/saved-plan-detail.tsx"
s = open(path).read()
s = s.replace('import { fonts } from "@/constants/design";\n', 'import { fonts } from "@/constants/design";\nimport ScreenBackground from "@/components/ui/ScreenBackground";\nimport { ScreenHeader } from "@/components/ui/Dashboard";\n', 1)
s = sub(s, '''        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>Plan Not Found</Text>
          <View style={styles.backBtn} />
        </View>''', '''        <ScreenBackground />
        <View style={{ paddingHorizontal: 16 }}>
          <ScreenHeader title="Saved Plan" onBack={() => router.back()} />
        </View>''', path)
m = re.search(r'      <View style=\{\[styles\.topBar, \{ paddingTop: insets\.top \+ 8 \}\]\}>\n.*?\n        <View style=\{styles\.backBtn\} />\n      </View>\n', s, re.S)
assert m
s = s[:m.start()] + '''      <ScreenBackground />
      <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 4 }}>
        <ScreenHeader
          title={plan.title}
          subtitle={`${plan.duration} · ${plan.mealsPerDay} meals/day`}
          onBack={() => router.back()}
        />
      </View>
''' + s[m.end():]
s = s.replace('''  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },''', '''  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },''', 1)
open(path, "w").write(s); print("ok", path)

# supplements
path = "app/supplements.tsx"
s = open(path).read()
m = re.search(r'        <View style=\{\[styles\.header, \{ paddingTop: insets\.top \+ 8 \}\]\}>\n.*?\n        </View>\n', s, re.S)
assert m
s = s[:m.start()] + '''        <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 4 }}>
          <ScreenHeader title="Supplements" subtitle="AIS framework" onBack={() => router.back()} />
        </View>
''' + s[m.end():]
s = s.replace('import ScreenBackground from "@/components/ui/ScreenBackground";\n', 'import ScreenBackground from "@/components/ui/ScreenBackground";\nimport { ScreenHeader } from "@/components/ui/Dashboard";\n', 1)
open(path, "w").write(s); print("ok", path)
