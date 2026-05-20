import { supabase } from "@/lib/supabase";

export const generateAndSendOtp = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error('Error sending OTP via Supabase:', error);
    throw new Error(error.message || 'Failed to send OTP email');
  }

  return true;
};

export const verifyOtp = async (email: string, submittedOtp: string): Promise<boolean> => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: submittedOtp,
    type: 'email',
  });

  if (error) {
    console.error('Error verifying OTP via Supabase:', error);
    return false;
  }

  return !!data?.session || !!data?.user;
};
