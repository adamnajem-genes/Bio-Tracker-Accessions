-- Remove unused/insecure email 2FA infrastructure
DROP TABLE IF EXISTS public.email_otp_codes;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS mfa_email_enabled;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS mfa_verified_at;

-- Lock down SECURITY DEFINER functions: only the trigger system / service role should call them
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;