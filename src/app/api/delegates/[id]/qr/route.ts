import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getDelegateById } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const delegate = await getDelegateById(params.id);
  if (!delegate) {
    return NextResponse.json({ error: "Delegate not found" }, { status: 404 });
  }

  const buffer = await QRCode.toBuffer(delegate.id, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
