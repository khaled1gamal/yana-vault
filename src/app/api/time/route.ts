import { NextResponse } from "next/server";
import { getTrustedUnlockState } from "@/lib/time/serverTime";
import { readSession } from "@/lib/auth/session";
import { publicCapsuleId } from "@/constants/capsule";

export async function GET() {
  const session = await readSession();
  const capsuleId = session?.capsuleId || publicCapsuleId();
  const payload = await getTrustedUnlockState(capsuleId);

  if (!session) {
    return NextResponse.json({
      ...payload,
      session: null,
      decisionSource: "server",
    });
  }

  return NextResponse.json({
    ...payload,
    role: session.role,
    uid: session.uid,
    email: session.email,
    capsuleId: session.capsuleId,
    decisionSource: "server",
  });
}
