import { describe, expect, it } from "vitest";
import {
  answerQuestion,
  createElicitationEngine,
  isAnswered,
  isPayloadComplete,
  nextIncompleteIndex,
  type ElicitationQuestion,
} from "./elicitation";

const QUESTIONS: ElicitationQuestion[] = [
  { key: "company", question: "What's your company?", type: "text_input" },
  { key: "challenge", question: "What challenge brings you here?", type: "single_select", options: ["A", "B"] },
];

describe("isAnswered", () => {
  it("is false when the key is missing", () => {
    expect(isAnswered({}, QUESTIONS[0])).toBe(false);
  });

  it("is false for an empty string answer", () => {
    expect(isAnswered({ company: "" }, QUESTIONS[0])).toBe(false);
  });

  it("is true for a non-empty answer", () => {
    expect(isAnswered({ company: "Acme Co" }, QUESTIONS[0])).toBe(true);
  });
});

describe("isPayloadComplete", () => {
  it("is false when any question is unanswered", () => {
    expect(isPayloadComplete(QUESTIONS, { company: "Acme Co" })).toBe(false);
  });

  it("is true when every question is answered", () => {
    expect(isPayloadComplete(QUESTIONS, { company: "Acme Co", challenge: "A" })).toBe(true);
  });

  it("is true for an empty question list", () => {
    expect(isPayloadComplete([], {})).toBe(true);
  });
});

describe("nextIncompleteIndex", () => {
  it("returns the index of the first unanswered question", () => {
    expect(nextIncompleteIndex(QUESTIONS, {})).toBe(0);
    expect(nextIncompleteIndex(QUESTIONS, { company: "Acme Co" })).toBe(1);
  });

  it("returns -1 when every question is answered", () => {
    expect(nextIncompleteIndex(QUESTIONS, { company: "Acme Co", challenge: "A" })).toBe(-1);
  });
});

describe("answerQuestion", () => {
  it("adds a new key without mutating the input payload", () => {
    const original = { company: "Acme Co" };
    const updated = answerQuestion(original, "challenge", "A");

    expect(updated).toEqual({ company: "Acme Co", challenge: "A" });
    expect(original).toEqual({ company: "Acme Co" });
  });

  it("overwrites an existing key", () => {
    const updated = answerQuestion({ challenge: "A" }, "challenge", "B");
    expect(updated.challenge).toBe("B");
  });
});

describe("createElicitationEngine", () => {
  it("present() rejects since no headless caller exists yet", async () => {
    const engine = createElicitationEngine();
    await expect(engine.present(QUESTIONS)).rejects.toThrow(/headless caller/);
  });
});
