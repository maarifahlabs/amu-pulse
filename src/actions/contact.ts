"use server";

import { redirect } from "next/navigation";
import { messageHref } from "@/lib/format";
import { sendContactMessage } from "@/lib/mail";
import { contactSchema, firstError, formToObject } from "@/lib/validations";

export async function submitContact(formData: FormData) {
  const parsed = contactSchema.safeParse(formToObject(formData));
  if (!parsed.success) redirect(messageHref("/contact", "error", firstError(parsed.error)));

  const sent = await sendContactMessage({
    name: parsed.data.name,
    email: parsed.data.email,
    body: parsed.data.message,
  });
  if (!sent) {
    redirect(messageHref("/contact", "error", "We could not send that message. Email contact@maarifahlabs.com directly."));
  }
  redirect(messageHref("/contact", "ok", "Message sent. We will reply at the email you entered."));
}
