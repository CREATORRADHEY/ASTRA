import { NextResponse } from "next/server";
import { fetchEonetEvents } from "@/lib/eonet";

export const revalidate = 600; // Cache for 10 minutes

export async function GET() {
  const events = await fetchEonetEvents();
  return NextResponse.json(events);
}
