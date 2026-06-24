// ── In-memory mock email log (dev only) ──────────────────────────────────────
export interface MockEmail {
  id: string;
  to: string;
  subject: string;
  preview: string;
  sentAt: Date;
}

const emailLog: MockEmail[] = [];

export function sendMockEmail(to: string, subject: string, body: string): void {
  const preview = body.slice(0, 200);
  const email: MockEmail = { id: Date.now().toString(), to, subject, preview, sentAt: new Date() };
  emailLog.unshift(email);
  if (emailLog.length > 50) emailLog.pop();
  console.log(`[EMAIL] To: ${to} | Subject: "${subject}" | Preview: ${preview}`);
}

export function getMockEmails(): MockEmail[] { return emailLog; }
