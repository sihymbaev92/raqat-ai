import {
  explainEmptyAiResponse,
  explainHollowAiServerReply,
  isHollowAiServerReply,
  normalizeAiServerReplyText,
} from "../explainEmptyAiResponse";

describe("explainEmptyAiResponse", () => {
  it("detects abort timeout", () => {
    const msg = explainEmptyAiResponse(
      { ok: false, detail: "AbortError: Aborted" },
      { mode: "quick" }
    );
    expect(msg).toContain("уақыт");
  });

  it("maps 429", () => {
    const msg = explainEmptyAiResponse({ ok: false, status: 429 }, { mode: "quick" });
    expect(msg.length).toBeGreaterThan(5);
  });

  it("maps parse_error", () => {
    const msg = explainEmptyAiResponse({ ok: false, detail: "parse_error", status: 200 }, { mode: "quick" });
    expect(msg).toBeTruthy();
  });

  it("detects gemini busy placeholder as hollow", () => {
    expect(
      isHollowAiServerReply("AI сервері қазір бос емес. 1-2 минуттан кейін қайта сұрап көріңіз.")
    ).toBe(true);
  });

  it("maps hollow server text to user-facing AI busy message", () => {
    const busy = "AI сервері қазір бос емес. 1-2 минуттан кейін қайта сұрап көріңіз.";
    expect(normalizeAiServerReplyText(busy, { ok: true })).toBe(explainHollowAiServerReply());
    expect(explainHollowAiServerReply()).toContain("AI қызметі");
    expect(explainHollowAiServerReply()).not.toContain("Gemini");
  });

  it("clears text when server reports gemini_busy", () => {
    expect(
      normalizeAiServerReplyText("anything", { ok: false, error: "gemini_busy" })
    ).toBe("");
  });
});
