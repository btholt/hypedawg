// @ts-nocheck

import { VertexAI } from "@google-cloud/vertexai";
import getPrompt from "./getPrompt";

export default async function getHype(breed, language, code) {
  // put your credentials in here.
  const vertex_ai = new VertexAI({
    project: "YOUR PROJECT ID",
    location: "us-central1", // or whatever server you want
  });
  const model = "gemini-1.5-flash-002";

  var textsi_1 = { text: getPrompt(breed) };

  const always = {
    text: `
    You are to give your answer as a valid JSON object. The text field will be the text that will actually be shown to the user. The animation is an enumerated type of animations. Your valid options are walk, run, playful, bark, sit, tilt, leap, howl, paw, beg, rollover, and wetDogShake. Choose the animation that best fits the tone of your response. Do not provide markdown, only text inside of these JSON fields. Limit yourself to about seven sentences or less.
  `,
  };

  const languageObj = {
    text: `The programming language for this snippet is ${language}`,
  };

  // Instantiate the models
  const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
    generation_config: {
      max_output_tokens: 8192,
      temperature: 2,
      top_p: 0.95,
    },
    safetySettings: [
      {
        // @ts-ignore
        category: "HARM_CATEGORY_HATE_SPEECH",
        // @ts-ignore
        threshold: "OFF",
      },
      {
        // @ts-ignore
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        // @ts-ignore
        threshold: "OFF",
      },
      {
        // @ts-ignore
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        // @ts-ignore
        threshold: "OFF",
      },
      {
        // @ts-ignore
        category: "HARM_CATEGORY_HARASSMENT",
        // @ts-ignore
        threshold: "OFF",
      },
    ],
    // @ts-ignore
    systemInstruction: {
      parts: [textsi_1, always],
    },
  });

  const req = {
    contents: [{ role: "user", parts: [languageObj, { text: code }] }],
  };

  const { response } = await generativeModel.generateContent(req);

  // Gemini gives the JSON back as markdown. I'm positive there's a better way to do this but YOLO
  const jsonText = response.candidates[0].content.parts[0].text
    .replace("```json", "")
    .replace("```", "");

  const obj = JSON.parse(jsonText);

  return obj;
}
