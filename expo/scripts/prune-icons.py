"""One-off: drop lucide icon imports that are no longer referenced in a file."""
import re, sys
for path in sys.argv[1:]:
    s = open(path).read()
    m = re.search(r'import \{([^}]*)\} from "lucide-react-native";', s)
    if not m: continue
    names = [n.strip() for n in m.group(1).split(",") if n.strip()]
    body = s[:m.start()] + s[m.end():]
    keep = [n for n in names if re.search(r"\b" + re.escape(n.split(" as ")[-1].replace("type ", "")) + r"\b", body)]
    if keep == names: continue
    new = "import {\n" + "".join(f"  {n},\n" for n in keep) + '} from "lucide-react-native";' if keep else ""
    s = s[:m.start()] + new + s[m.end():]
    open(path, "w").write(s)
    print(path, "removed", sorted(set(names) - set(keep)))
