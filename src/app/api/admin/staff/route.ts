import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password, fullName, adminId } = await req.json();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { first_name: fullName.split(' ')[0], last_name: fullName.split(' ')[1] || "", created_by: adminId }
  });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id!);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const { userId, email, password, fullName } = await req.json();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const nameParts = fullName.trim().split(/\s+/);
  const updateData: any = { email, user_metadata: { first_name: nameParts[0], last_name: nameParts[1] || "" } };
  if (password) updateData.password = password;

  await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
  await supabaseAdmin.from("profiles").update({ first_name: nameParts[0], last_name: nameParts[1] || "", email }).eq("id", userId);
  
  return NextResponse.json({ success: true });
}