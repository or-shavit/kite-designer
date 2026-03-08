import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { colorA, colorB, colorC } = await req.json();

    const prompt = `Give a short evocative name (2-4 words, title case) for a kite design with these colors: Band A = ${colorA}, Band B = ${colorB}, Band C = ${colorC}. Respond with only the name, no quotes or explanation.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const name = result.response.text().trim();
    return NextResponse.json({ name });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ name: "Untitled Design" });
  }
}
