import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { message, history, language = 'sq' } = await req.json();

    // Përdor token-in e sesionit të userit për të kaluar RLS
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
    );

    // Merr company_id nga profili i userit
    const { data: { user } } = await supabase.auth.getUser();
    const profileRes = user
      ? await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
      : { data: null };
    const companyId = profileRes.data?.company_id;

    // Merr të dhënat live nga Supabase
    const [productsRes, categoriesRes, movementsRes, companyRes] = await Promise.all([
      supabase.from('products').select('name, sku, category, price, quantity, min_stock_level, description').order('quantity', { ascending: true }),
      supabase.from('categories').select('name'),
      supabase.from('stock_movements').select('type, quantity, reason, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: false }).limit(50),
      companyId
        ? supabase.from('company_settings').select('company_name, description, founding_year, address, phone, email, website, registration_number, currency, bank_name, iban, swift_code, vat_number').eq('company_id', companyId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    const movements = movementsRes.data || [];
    const company = companyRes.data;

    const lowStock = products.filter((p: any) => p.quantity <= p.min_stock_level);
    const outOfStock = products.filter((p: any) => p.quantity <= 0);
    const totalValue = products.reduce((sum: number, p: any) => sum + (Number(p.price) * Number(p.quantity)), 0);
    const totalIN = movements.filter((m: any) => m.type === 'IN').reduce((s: number, m: any) => s + m.quantity, 0);
    const totalOUT = movements.filter((m: any) => m.type === 'OUT').reduce((s: number, m: any) => s + m.quantity, 0);

    const currencySymbol = company?.currency === 'USD' ? '$' : company?.currency === 'GBP' ? '£' : company?.currency === 'ALL' ? 'L' : '€';

    const inventoryContext = `
=== INFORMACIONI I KOMPANISË ===
${company ? [
      `Emri: ${company.company_name || 'Pa emër'}`,
      `Përshkrimi: ${company.description || '—'}`,
      company.founding_year ? `Viti i themelimit: ${company.founding_year}` : null,
      company.address ? `Adresa: ${company.address}` : null,
      company.phone ? `Telefon: ${company.phone}` : null,
      company.email ? `Email: ${company.email}` : null,
      company.website ? `Website: ${company.website}` : null,
      company.registration_number ? `Nr. Regjistrimit: ${company.registration_number}` : null,
      `Valuta: ${company.currency || 'EUR'}`,
      company.bank_name ? `Banka: ${company.bank_name}` : null,
      company.iban ? `IBAN: ${company.iban}` : null,
      company.swift_code ? `SWIFT: ${company.swift_code}` : null,
      company.vat_number ? `Nr. TVSH: ${company.vat_number}` : null,
    ].filter(Boolean).join('\n') : 'Nuk ka të dhëna për kompaninë'}

=== TË DHËNAT E INVENTARIT (Real-time) ===

PRODUKTET (${products.length} gjithsej):
${products.map((p: any) => `• ${p.name} | SKU: ${p.sku} | Kategoria: ${p.category} | Çmimi: €${p.price} | Stoku: ${p.quantity} | Min: ${p.min_stock_level}`).join('\n')}

STOK I ULËT (${lowStock.length} produkte):
${lowStock.length > 0 ? lowStock.map((p: any) => `• ${p.name}: ${p.quantity} mbetur (min: ${p.min_stock_level})`).join('\n') : 'Asnjë'}

STOK 0 - PA MALL (${outOfStock.length} produkte):
${outOfStock.length > 0 ? outOfStock.map((p: any) => `• ${p.name}`).join('\n') : 'Asnjë'}

KATEGORITE (${categories.length}): ${categories.map((c: any) => c.name).join(', ')}

VLERA TOTALE E INVENTARIT: €${totalValue.toFixed(2)}
LËVIZJET 30 DITËT E FUNDIT: ${movements.length} lëvizje | Hyrje: +${totalIN} njësi | Dalje: -${totalOUT} njësi

LËVIZJET E FUNDIT:
${movements.slice(0, 15).map((m: any) => `• ${m.type === 'IN' ? 'HYRJE' : 'DALJE'} ${m.quantity} njësi — ${m.reason} (${new Date(m.created_at).toLocaleDateString('sq-AL')})`).join('\n')}
`.trim();

    const systemPrompt = `Ti je AI Asistenti i dedikuar për sistemin e menaxhimit të inventarit të kompanisë "${company?.company_name || 'kësaj kompanie'}". Quhu "IMS Assistant".

GJUHA E DETYRUESHME: ${language === 'en' ? 'Respond ONLY in ENGLISH, regardless of the language of the question.' : 'Përgjigju VETËM në SHQIP, pavarësisht gjuhës së pyetjes.'}

RREGULLAT E DETYRUESHME:
1. Përgjigju VETËM pyetjeve që lidhen me: kompaninë, inventarin, produktet, stokun, kategorite, çmimet, lëvizjet e stokut, vlerën e inventarit dhe çdo aspekt tjetër të biznesit
2. Nëse pyetja nuk ka absolutisht asnjë lidhje me biznesin ose inventarin (p.sh. politikë, sport, receta), refuzo ${language === 'en' ? 'with: "I can only help with questions related to your inventory and business."' : 'me: "Mund t\'ju ndihmoj vetëm për çështje që lidhen me inventarin dhe biznesin tuaj."'}
3. Jep përgjigje të sakta, të shkurtra dhe profesionale
4. Bëhu SAKTËSISHT i bazuar në të dhënat e mëposhtme — mos shpik produkte, çmime apo numra që nuk ekzistojnë
5. ${language === 'en' ? 'If inventory is empty, state clearly: "The inventory is currently empty"' : 'Nëse inventari është bosh, thuaj qartë: "Inventari është aktualisht i zbrazët"'}

${inventoryContext}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-8),
          { role: 'user', content: message },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Ndodhi një gabim. Provo sërish.';
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: 'Dështoi AI asistenti.' }, { status: 500 });
  }
}
