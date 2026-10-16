/** Accounts with owner controls (the /admin page, free Plus). Safe to ship to the client: it's just an email. */
export const OWNER_EMAILS = ['fenua@fenuaibabao.com'];
export const isOwnerEmail = (email: string | null | undefined) => !!email && OWNER_EMAILS.includes(email.toLowerCase());
