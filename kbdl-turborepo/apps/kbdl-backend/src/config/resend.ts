import { env } from "@repo/validator/server";
import { Resend } from "resend";
const resend = new Resend(env.RESEND_API_KEY);
export const resendClient = resend;