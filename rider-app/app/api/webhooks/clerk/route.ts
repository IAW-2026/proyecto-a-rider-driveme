import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Webhook } from "svix";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET ?? "";

export async function POST(request: NextRequest) {

  const payload = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 401 });
  }

  const webhook = new Webhook(webhookSecret);

  let event: any;
  try {
    event = webhook.verify(payload, headers);
  } catch (error) {
    console.error("Clerk webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  if (event.type !== "user.created") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const userId = event.data?.id ?? event.data?.object?.id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id in webhook payload" }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "rider" },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating Clerk user metadata on webhook:", error);
    return NextResponse.json(
      { error: "Unable to update user role", details: String(error) },
      { status: 500 },
    );
  }
}
