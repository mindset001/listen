import { NextResponse } from "next/server";
import { getUsersCollection, getDocumentsCollection } from "@/lib/db";
import { withRetry } from "@/lib/mongodb";
import { getCurrentUser, requireUser, verifyPassword, revokeAllSessions, destroySession, toPublicUser } from "@/lib/auth";
import { deleteAudioFile } from "@/lib/audioStorage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized", message: "Not signed in." }, { status: 401 });
  }
  return NextResponse.json(toPublicUser(user));
}

export async function DELETE(request) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { password } = await request.json().catch(() => ({}));

  if (user.passwordHash) {
    const valid = password && (await verifyPassword(password, user.passwordHash));
    if (!valid) {
      return NextResponse.json(
        { error: "wrong_password", message: "Your password is not right." },
        { status: 401 }
      );
    }
  }

  const userId = user._id.toString();

  try {
    await withRetry(async () => {
      const documents = await getDocumentsCollection();
      const docs = await documents.find({ userId }).toArray();
      await Promise.all(docs.flatMap((d) => (d.segments || []).map((s) => deleteAudioFile(s.fileId))));
      await documents.deleteMany({ userId });

      const users = await getUsersCollection();
      await users.deleteOne({ _id: user._id });
    });

    await revokeAllSessions(userId);
    await destroySession();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/auth/me]", err);
    return NextResponse.json(
      { error: "unavailable", message: "Could not reach the database. Try again in a moment." },
      { status: 503 }
    );
  }
}
