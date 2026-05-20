import { NextResponse } from "next/server";
import { getHelloMessage } from "../services/hello.service";

export const handleGetHello = async () => {
  try {
    const data = getHelloMessage();
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 }
    );
  }
};
