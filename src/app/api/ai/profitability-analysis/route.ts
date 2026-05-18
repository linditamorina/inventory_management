import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { products, period, currency, language } = await req.json();

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'Nuk ka të dhëna produktesh.' }, { status: 400 });
    }

    // Llogarit metrikat për çdo produkt
    const enriched = products.map((p: any) => ({
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: Number(p.price || 0),
      currentStock: Number(p.stok || 0),
      unitsSold: Number(p.dalje || 0),
      unitsReceived: Number(p.hyrje || 0),
      revenue: Number(p.dalje || 0) * Number(p.price || 0),
      stockValue: Number(p.stok || 0) * Number(p.price || 0),
      turnoverRate: (Number(p.stok || 0) + Number(p.dalje || 0)) > 0
        ? Math.round((Number(p.dalje || 0) / (Number(p.stok || 0) + Number(p.dalje || 0))) * 100)
        : 0,
    }));

    const totalRevenue = enriched.reduce((s: number, p: any) => s + p.revenue, 0);
    const totalStockValue = enriched.reduce((s: number, p: any) => s + p.stockValue, 0);

    const dataContext = enriched.map((p: any) =>
      `• ${p.name} (SKU: ${p.sku}) | Kategori: ${p.category} | Çmim: ${currency}${p.price.toFixed(2)} | Shitur: ${p.unitsSold} njësi | Stok aktual: ${p.currentStock} njësi | Të ardhura: ${currency}${p.revenue.toFixed(2)} | Vlera stok: ${currency}${p.stockValue.toFixed(2)} | Qarkullim: ${p.turnoverRate}%`
    ).join('\n');

    const langInstruction = language === 'en'
      ? 'Respond ONLY in ENGLISH.'
      : 'Përgjigju VETËM NË SHQIP.';

    const prompt = `${langInstruction}

Ti je ekspert Analist i Profitabilitetit të Inventarit me 15+ vjet eksperiencë. Analizoje këtë inventar.

PERIUDHA: ${period}
VALUTA: ${currency}
PRODUKTET (${enriched.length} gjithsej):
${dataContext}

TË ARDHURAT TOTALE NGA SHITJET: ${currency}${totalRevenue.toFixed(2)}
VLERA TOTALE E STOKUT AKTUAL: ${currency}${totalStockValue.toFixed(2)}

Kthe analizën si JSON me SAKTËSISHT këtë strukturë (mos shto fusha shtesë):
{
  "summary": {
    "totalProducts": <numër>,
    "healthStatus": "<Healthy|Needs Improvement|Critical>",
    "healthReason": "<1 fjali pse>",
    "totalRevenue": "<shuma e formatuar>",
    "totalStockValue": "<shuma e formatuar>",
    "top3": [{"name":"","revenue":"","units":<n>,"reason":""}],
    "worst3": [{"name":"","issue":"","units":<n>}]
  },
  "highProfit": [{"name":"","revenue":"","units":<n>,"margin":"","reason":""}],
  "avgProfit": [{"name":"","revenue":"","units":<n>,"note":""}],
  "lossMakers": [{"name":"","issue":"","stockValue":"","suggestion":""}],
  "highPotential": [{"name":"","reason":"","action":""}],
  "scaleUp": [{"name":"","currentUnits":<n>,"suggestedIncrease":"","why":"","how":""}],
  "reduce": [{"name":"","strategy":"","estimatedLoss":""}],
  "test": [{"idea":"","expectedImpact":""}],
  "general": {
    "stockStrategy": "<2-3 fjali>",
    "marginIdeas": "<2-3 fjali>",
    "mainRisk": "<1-2 fjali>",
    "kpis": ["<kpi1>","<kpi2>","<kpi3>","<kpi4>"]
  }
}

Rregulla:
- Baza vetëm te të dhënat e dhëna, mos shpik numra
- Nëse një produkt ka 0 shitje dhe stok>0 → është "dead stock" → shko te lossMakers
- Qarkullimi >60% = fitimprurës i lartë; 20-60% = mesatar; <20% = i ngecur
- Jep numra konkretë (p.sh. "+40% stok shtesë", "${currency}1,200 humbje potenciale")`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Ti je analist financiar që kthen VETËM JSON të vlefshëm, asnjë tekst jashtë JSON.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(raw);
    return NextResponse.json({ analysis });

  } catch (error: any) {
    console.error('Profitability analysis error:', error);
    return NextResponse.json({ error: 'Gabim gjatë analizës.', details: error.message }, { status: 500 });
  }
}
