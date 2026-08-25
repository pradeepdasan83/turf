// SMS delivery for OTP codes.
//
// Free option for India: Fast2SMS (https://www.fast2sms.com) — India-only gateway
// that gives free wallet credits on signup and has a dedicated OTP route.
// Set FAST2SMS_API_KEY in the environment to enable real delivery.
//
// When no provider key is configured the app runs in "dev mode": no SMS is sent
// and the generated code is returned to the client so the flow stays testable.

export interface SendResult {
  sent: boolean;
  provider: 'fast2sms' | 'dev';
  devCode?: string; // only populated in dev mode
  error?: string;
}

// Send an OTP to a 10-digit Indian mobile number.
export async function sendOtpSms(localNumber: string, code: string): Promise<SendResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;

  // Dev mode — surface the code instead of sending an SMS
  if (!apiKey) {
    return { sent: false, provider: 'dev', devCode: code };
  }

  try {
    // Fast2SMS OTP route: delivers "Your OTP is <code>" to Indian numbers.
    const url = new URL('https://www.fast2sms.com/dev/bulkV2');
    url.searchParams.set('authorization', apiKey);
    url.searchParams.set('route', 'otp');
    url.searchParams.set('variables_values', code);
    url.searchParams.set('numbers', localNumber);
    url.searchParams.set('flash', '0');

    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.return === true) {
      return { sent: true, provider: 'fast2sms' };
    }
    return {
      sent: false,
      provider: 'fast2sms',
      error: data?.message?.[0] || data?.message || 'SMS provider rejected the request',
    };
  } catch (err: any) {
    console.error('Fast2SMS send error:', err);
    return { sent: false, provider: 'fast2sms', error: 'Could not reach SMS provider' };
  }
}
