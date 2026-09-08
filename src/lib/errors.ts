export type AppErrorCode =
  | "unauthenticated"
  | "permission_denied"
  | "not_found"
  | "invalid_input"
  | "network"
  | "unavailable"
  | "upload_failed"
  | "unsupported"
  | "session_expired"
  | "unknown";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;

  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code: string }).code);
    switch (code) {
      case "auth/invalid-email":
        return "That email doesn’t look right. Please check your email address.";
      case "auth/user-disabled":
        return "This account is disabled.";
      case "auth/user-not-found":
        return "No account found with this email. If you were invited, click 'Create your password' below.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-credential":
        return "Email or password is incorrect. (If creating an account for the first time, click 'Create your password' below).";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Sign in above instead.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 8 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Take a breath and try again in a few minutes.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Pop-up was blocked by the browser. Please allow pop-ups for this site.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled in the Firebase console (Authentication > Sign-in method).";
      case "auth/unauthorized-domain":
        return "This domain is not in the Firebase Authentication authorized domains list.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email. Try signing in with your email and password.";
      case "auth/network-request-failed":
        return "Network issue. Check your connection and retry.";
      case "permission-denied":
        return "You don’t have access to that yet.";
      case "unavailable":
        return "The vault is taking a tiny nap. Please retry.";
      default:
        break;
    }
  }

  if (error instanceof Error && error.message) return error.message;

  return "Something went wrong. Please try again.";
}
