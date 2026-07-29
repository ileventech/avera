import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { ALL_ROLES } from '@/lib/rbac';

const VALID_ROLES = ALL_ROLES;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
  const role = VALID_ROLES.includes(body?.role) ? body.role : 'Member';

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  // Only a signed-in Administrator may invite teammates, and the invitee
  // joins the CALLER's organization — never a new one and never one the
  // caller specifies, so this can't be used to plant a user into someone
  // else's org.
  const supabase = await createServerClient();
  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) {
    return NextResponse.json({ error: 'You must be signed in to invite teammates.' }, { status: 401 });
  }

  const { data: callerProfile, error: callerProfileError } = await supabase
    .from('profiles')
    .select('organization_id,role')
    .eq('id', caller.id)
    .single();
  if (callerProfileError || !callerProfile) {
    return NextResponse.json({ error: 'Could not verify your account.' }, { status: 500 });
  }
  if (callerProfile.role !== 'Administrator') {
    return NextResponse.json({ error: 'Only Administrators can invite teammates.' }, { status: 403 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Admin client unavailable.' }, { status: 500 });
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, organization_id: callerProfile.organization_id },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    await admin.from('profiles').update({ role, full_name: fullName }).eq('id', data.user.id);
  }

  return NextResponse.json({ success: true });
}
