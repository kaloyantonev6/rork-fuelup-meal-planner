"""One-off: remove StyleSheet keys that are no longer referenced (styles.<key>)."""
import re, sys
keys = sys.argv[1].split(",")
for path in sys.argv[2:]:
    s = open(path).read()
    removed = []
    for k in keys:
        if re.search(r"styles\." + k + r"\b", s): continue
        m = re.search(r"\n  " + k + r": \{", s)
        if not m: continue
        i = m.end(); depth = 1
        while depth:
            depth += {"{": 1, "}": -1}.get(s[i], 0); i += 1
        if s[i] == ",": i += 1
        s = s[:m.start()] + s[i:]; removed.append(k)
    open(path, "w").write(s)
    if removed: print(path, removed)
