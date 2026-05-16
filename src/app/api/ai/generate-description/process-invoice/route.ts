import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Inicializimi i Groq me çelësin sekret nga .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, type } = body;

    let prompt = "";

    // Logjika për Parashikimin e Stokut
    if (type === 'prediction') {
      prompt = `
        Je një ekspert i menaxhimit të stokut dhe analizës së të dhënave (Supply Chain Analyst). 
        Të dhënat e lëvizjeve të stokut (hyrje/dalje) për këtë periudhë janë:
        ${text}
        
        Të lutem, bëj një analizë të shkurtër dhe jep një sugjerim profesional (maksimumi 2-3 fjali) se si është trendi dhe çfarë duhet të bëjë kompania me porositë e radhës. 
        Kthe përgjigjen tënde KREJTËSISHT NË SHQIP.
        Kthe VETËM një objekt JSON me këtë strukturë fiks: {"recommendation": "Këtu shkruaj sugjerimin tënd në shqip"}
      `;
    } 
    // Logjika për leximin e faturave (Nëse keni pasur një të tillë më parë)
    else if (type === 'invoice') {
      prompt = `
        Act as an expert logistics data extractor. Extract items, supplier, and total from this text: ${text}
        Format strictly as JSON: {"items": [], "total": 0, "supplier": ""}
      `;
    }

    // Thirrja e Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Ti je një asistent AI që kthen gjithmonë dhe vetëm përgjigje në formatin JSON." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "llama-3.1-70b-versatile", // Ky është një model i shkëlqyer dhe i shpejtë
      response_format: { type: "json_object" }, // E detyrojmë të kthejë JSON
      temperature: 0.5, // E mbajmë pak serioz dhe analitik
    });

    const aiResponseText = completion.choices[0]?.message?.content || "{}";
    const parsedResponse = JSON.parse(aiResponseText);

    // Kthimi i përgjigjes te Frontend-i
    return NextResponse.json(parsedResponse);

  } catch (error: any) {
    console.error("Gabim në Backend API të AI:", error);
    return NextResponse.json(
      { error: "Ndodhi një gabim gjatë procesimit me AI.", details: error.message }, 
      { status: 500 }
    );
  }
}