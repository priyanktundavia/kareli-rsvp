import { NextResponse } from "next/server";

const GOOGLE_SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzJ6fdhjYoS1n5ctE2pDwA58lcIHq_voLIBGczuxmYdeZgYHjbq5B66Xug_OY8jvAjq/exec";

export async function GET() {
  try {
    const response = await fetch(GOOGLE_SHEETS_ENDPOINT, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json({
      families: Number(data.families || 0),
      attendees: Number(data.attendees || 0),
      rooms: Number(data.rooms || 0),
    });
  } catch (error) {
    return NextResponse.json({
      families: 0,
      attendees: 0,
      rooms: 0,
    });
  }
}