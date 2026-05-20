import { handleGetHello } from "@/server/controllers/hello.controller";

export const GET = async () => {
  return handleGetHello();
};
