import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "@/utils/config"

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const {cid} = await pinata.upload.private.file(file)
const url = await pinata.gateways.private.createAccessLink({
	cid: cid, // CID of the file to access
	expires: 30, // Number of seconds the link is valid for
});

    return NextResponse.json( cid, { status: 200 });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}