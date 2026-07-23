/**
 * Тәжуид HTML — браузер shaping-і араб әріптерін түсті span арасында да қосады
 * (React Native nested <Text> үзеді).
 */
import { tajweedColorForRule } from "../content/tajweedRulesCatalog";
import {
  tajweedColoredRuns,
  type TajweedColoredRun,
  type TajweedRuleKey,
} from "./alquranTajweedParse";
import {
  htmlFontTajweedRuns,
  isHtmlFontTajweedText,
  type HtmlFontTajweedRun,
} from "./htmlTajweedParse";

export function escapeTajweedHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type TajweedHtmlColorRun = { text: string; color?: string };

export function tajweedRunsToHtmlColorRuns(
  runs: TajweedColoredRun[],
  isDark: boolean,
  ink: string
): TajweedHtmlColorRun[] {
  return runs.map((run) => {
    const isWs = /^\s+$/u.test(run.text);
    if (isWs || !run.rule) return { text: run.text };
    return {
      text: run.text,
      color: tajweedColorForRule(run.rule as TajweedRuleKey, isDark) || ink,
    };
  });
}

export function htmlFontRunsToHtmlColorRuns(runs: HtmlFontTajweedRun[]): TajweedHtmlColorRun[] {
  return runs.map((run) =>
    run.color && !/^\s+$/u.test(run.text) ? { text: run.text, color: run.color } : { text: run.text }
  );
}

export function buildTajweedColoredBodyHtml(runs: TajweedHtmlColorRun[]): string {
  return runs
    .map((run) => {
      const escaped = escapeTajweedHtml(run.text);
      if (!run.color || /^\s+$/u.test(run.text)) return escaped;
      return `<span style="color:${run.color}">${escaped}</span>`;
    })
    .join("");
}

export function resolveTajweedHtmlColorRuns(
  taggedText: string,
  isDark: boolean,
  ink: string
): TajweedHtmlColorRun[] {
  const raw = (taggedText ?? "").trim();
  if (!raw) return [];
  if (isHtmlFontTajweedText(raw)) {
    return htmlFontRunsToHtmlColorRuns(htmlFontTajweedRuns(raw, isDark));
  }
  if (raw.includes("[")) {
    return tajweedRunsToHtmlColorRuns(tajweedColoredRuns(raw), isDark, ink);
  }
  return [{ text: raw }];
}

export type TajweedHtmlDocumentOpts = {
  bodyHtml: string;
  fontSize: number;
  lineHeight: number;
  ink: string;
  background?: string;
};

/** Auto-height WebView үшін толық HTML құжат. */
export function buildTajweedHtmlDocument(opts: TajweedHtmlDocumentOpts): string {
  const fontSize = Math.max(12, Math.round(opts.fontSize || 24));
  const lineHeight = Math.max(fontSize + 4, Math.round(opts.lineHeight || fontSize * 1.75));
  const ink = opts.ink || "#111111";
  const bg = opts.background ?? "transparent";
  const body = opts.bodyHtml || "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet"/>
<style>
html,body{margin:0;padding:0;background:${bg};}
#root{
  direction:rtl;
  unicode-bidi:isolate;
  text-align:right;
  font-size:${fontSize}px;
  line-height:${lineHeight}px;
  color:${ink};
  font-family:"Scheherazade New","Noto Naskh Arabic","Amiri",serif;
  font-weight:700;
  letter-spacing:0 !important;
  word-spacing:0 !important;
  white-space:normal;
  overflow-wrap:anywhere;
  word-break:keep-all;
  padding:0;
  margin:0;
  -webkit-font-smoothing:antialiased;
}
#root span{
  letter-spacing:0 !important;
  word-spacing:0 !important;
  display:inline;
  white-space:normal;
}
</style>
</head>
<body>
<div id="root">${body}</div>
<script>
(function(){
  function postH(){
    var el=document.getElementById("root");
    if(!el||!window.ReactNativeWebView)return;
    var h=Math.ceil(el.getBoundingClientRect().height||el.scrollHeight||0);
    window.ReactNativeWebView.postMessage(JSON.stringify({type:"h",h:h}));
  }
  if(document.fonts&&document.fonts.ready){
    document.fonts.ready.then(postH).catch(postH);
  }
  postH();
  if(typeof ResizeObserver!=="undefined"){
    new ResizeObserver(postH).observe(document.getElementById("root"));
  }
  window.addEventListener("load",postH);
  setTimeout(postH,80);
  setTimeout(postH,400);
})();
</script>
</body>
</html>`;
}
