import { handleSendOtp } from "@/server/controllers/otp.controller";

export async function POST(req: Request) {
  return handleSendOtp(req);
}
