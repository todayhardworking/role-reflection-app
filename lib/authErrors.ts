interface FirebaseErrorShape {
  code?: string;
  message?: string;
}

export function getAuthErrorMessage(error: unknown): string {
  const { code, message } = (error as FirebaseErrorShape) || {};

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    default:
      return message || "Something went wrong. Please try again.";
  }
}
