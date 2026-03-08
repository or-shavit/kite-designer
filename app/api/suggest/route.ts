import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { preferences } = await req.json();

    const prompt = preferences?.trim()
      ? `Suggest 3 harmonious 3-color palettes for a delta kite design. User preference: "${preferences}". Respond with JSON only in this exact format: {"palettes":[{"label":"<evocative name>","colorA":"#RRGGBB","colorB":"#RRGGBB","colorC":"#RRGGBB"},...]}`
      : `Suggest 3 harmonious 3-color palettes for a delta kite design. Make them visually striking and varied. Respond with JSON only in this exact format: {"palettes":[{"label":"<evocative name>","colorA":"#RRGGBB","colorB":"#RRGGBB","colorC":"#RRGGBB"},...]}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found in response");
    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
