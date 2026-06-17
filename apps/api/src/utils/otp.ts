/** Generate a 6-digit OTP (mock — logs to console in dev mode) */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
