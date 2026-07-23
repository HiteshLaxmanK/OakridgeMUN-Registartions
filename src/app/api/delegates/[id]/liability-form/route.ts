import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getDelegateById, markLiabilityFormOnFile } from "@/lib/db";
import { supabase, LIABILITY_FORMS_BUCKET } from "@/lib/supabase";

function pathFor(id: string) {
  return `${id}.pdf`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const delegate = await getDelegateById(params.id);
  if (!delegate) {
    return NextResponse.json({ error: "Delegate not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const files = formData.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
  }

  const pdfDoc = await PDFDocument.create();
  for (const file of files) {
    const imageBytes = Buffer.from(await file.arrayBuffer());
    const jpgImage = await pdfDoc.embedJpg(imageBytes);
    const { width, height } = jpgImage;
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(jpgImage, { x: 0, y: 0, width, height });
  }
  const pdfBytes = await pdfDoc.save();

  const { error: uploadError } = await supabase.storage
    .from(LIABILITY_FORMS_BUCKET)
    .upload(pathFor(params.id), pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const updated = await markLiabilityFormOnFile(params.id);
  return NextResponse.json({ ok: true, delegate: updated });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase.storage
    .from(LIABILITY_FORMS_BUCKET)
    .download(pathFor(params.id));

  if (error || !data) {
    return NextResponse.json(
      { error: "No liability form on file." },
      { status: 404 }
    );
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${params.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
