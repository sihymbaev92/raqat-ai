const res = await fetch("https://cdn.islamic.network/quran/info/by-ayah/info.json");
const tree = await res.json();
const editions = new Set();

function walk(node, path = []) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, path);
    return;
  }
  if (node.type === "directory" && node.name) {
    const next = [...path, node.name];
    if (next.length === 3 && /^\d+$/.test(next[1])) {
      editions.add(`${next[1]}/${next[2]}`);
    }
    for (const child of node.contents ?? []) walk(child, next);
  }
}

walk(tree);
const list = [...editions].sort();
for (const line of list.filter((x) => /\/(en|uz|ky|kk|ru|tr)\./.test(x))) {
  console.log(line);
}
