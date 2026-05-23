/**
 * Stubbed Email Dispatcher
 * Prevents build failure when lib/email is missing.
 */
export async function sendSystemEmail(template: string, recipient: string, data: any) {
    console.log(`[STUB] sendSystemEmail called for template: ${template}, recipient: ${recipient}`);
    return { success: true, message: "Email logic is currently stubbed." };
}
