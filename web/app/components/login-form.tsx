import { useState, useEffect, type ComponentProps, type FormEvent } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { isAuthenticated } from '~/lib/auth';
import { useNavigateWithTemplate } from '~/lib/template-context';

interface RequestOtpResponse {
  message?: string;
  error?: string;
  expiresIn?: number;
  isMockMode?: boolean;
  mockOtp?: string;
}

// Helper to request OTP via new API
async function requestOtp(identifier: string): Promise<{
  ok: boolean;
  error?: string;
  mockOtp?: string;
  isMockMode?: boolean;
}> {
  try {
    const res = await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: identifier }),
    });

    const data = (await res.json()) as RequestOtpResponse;

    if (res.ok) {
      return {
        ok: true,
        mockOtp: data.mockOtp,
        isMockMode: data.isMockMode,
      };
    } else {
      return {
        ok: false,
        error: data.error || 'Failed to send verification code',
      };
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Helper to verify OTP and get JWT token
async function verifyOtp(
  identifier: string,
  code: string
): Promise<{
  ok: boolean;
  authToken?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: identifier, code }),
    });

    const data = (await res.json()) as {
      authToken?: string;
      error?: string;
    };

    if (res.ok) {
      return { ok: true, authToken: data.authToken };
    } else {
      return {
        ok: false,
        error: data.error || 'Verification failed',
      };
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function LoginForm({ className, ...props }: ComponentProps<'div'>) {
  const navigate = useNavigateWithTemplate();
  const { t } = useTranslation();
  const [step, setStep] = useState<'identifier' | 'code'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleIdentifierSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMockOtp(null); // Clear previous mock OTP
    if (identifier.trim()) {
      setLoading(true);
      const result = await requestOtp(identifier.trim());
      setLoading(false);
      if (result.ok) {
        // Store mock OTP if in mock mode
        if (result.isMockMode && result.mockOtp) {
          setMockOtp(result.mockOtp);
          setIsMockMode(true);
        }
        setStep('code');
      } else {
        setError(result.error || t('login.errorSendingCode'));
      }
    }
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.trim() && identifier.trim()) {
      setLoading(true);
      const result = await verifyOtp(identifier.trim(), code.trim());
      setLoading(false);

      if (result.ok && result.authToken) {
        // Store JWT token
        localStorage.setItem('auth_token', result.authToken);

        // Navigate to home page
        navigate('/');
      } else {
        setError(result.error || t('login.errorVerifying'));
      }
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStep('identifier');
    setCode('');
    setMockOtp(null); // Clear mock OTP
    setIsMockMode(false);
  };

  return (
    <div className={cn('flex flex-col gap-8', className)} {...props}>
      {/* Apple-style dotted circle */}
      <div className="flex justify-center mt-8 mb-8">
        <div className="relative w-32 h-32">
          {/* Dotted circle pattern */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-48 h-48 rounded-full border-2 border-dashed border-orange-300 opacity-60" />
            <div className="absolute w-40 h-40 rounded-full border-2 border-dashed border-orange-300 opacity-50" />
            <div className="absolute w-32 h-32 rounded-full border-2 border-dashed border-orange-300 opacity-40" />
          </div>

          {/* Center logo placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/apple.svg"
              alt="Logo"
              style={{ width: '48px', height: '60px', marginTop: '-10px' }}
            />
          </div>
        </div>
      </div>

      <div className="text-center mb-8 mt-8">
        <h2 className="text-3xl font-medium text-gray-900 mb-2">{t('login.title')}</h2>
        <p className="text-gray-600">{t('login.description')}</p>
      </div>

      {step === 'identifier' ? (
        <form onSubmit={handleIdentifierSubmit} className="space-y-4" autoComplete="on">
          <div className="relative">
            <div className="relative flex items-center">
              <Input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                className="h-14 text-lg px-4 pr-16 rounded-2xl border-2 border-gray-200 focus:border-gray-300 focus:ring-0"
                required
                disabled={loading}
                autoComplete="email"
                inputMode="email"
              />
              <Button
                type="submit"
                className="absolute right-2 h-10 w-10 rounded-full border-2 border-gray-200 bg-white hover:bg-gray-50 p-0 flex items-center justify-center shadow-sm"
                disabled={loading || !identifier.trim()}
              >
                <ArrowRight className="text-gray-500" />
              </Button>
            </div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </form>
      ) : (
        <form
          id="otp-form"
          onSubmit={handleCodeSubmit}
          className="space-y-4"
          autoComplete="one-time-code"
        >
          <div className="relative">
            <div className="relative flex items-center">
              <Input
                type="text"
                value={identifier}
                className="h-14 text-lg px-4 pr-16 rounded-2xl border-2 border-gray-200 bg-gray-50"
                disabled
                readOnly
              />
              <Button
                type="button"
                onClick={handleBack}
                className="absolute right-2 h-10 w-10 rounded-full border-2 border-gray-200 bg-white hover:bg-gray-50 p-0 flex items-center justify-center shadow-sm"
                disabled={loading}
              >
                <X className="text-gray-500" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="relative flex items-center">
              <Input
                id="otp-input"
                name="otp"
                type="tel"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={t('login.codePlaceholder')}
                className="h-14 text-lg px-4 pr-16 rounded-2xl border-2 border-gray-200 focus:border-gray-300 focus:ring-0 tracking-widest"
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                enterKeyHint="done"
                autoFocus
                disabled={loading}
                maxLength={6}
                pattern="\d*"
              />
              <Button
                type="submit"
                className="absolute right-2 h-10 w-10 rounded-full border-2 border-gray-200 bg-white hover:bg-gray-50 p-0 flex items-center justify-center shadow-sm"
                disabled={loading || !code.trim() || !identifier.trim()}
              >
                <ArrowRight className="text-gray-500" />
              </Button>
            </div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {step === 'code' && isMockMode && mockOtp && (
            <div className="mt-4 p-4 bg-gray-100 rounded-2xl border-2 border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {t('login.mockModeLabel')}
                </p>
                <div className="font-mono text-2xl font-bold text-gray-900 tracking-widest">
                  {mockOtp}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t('login.mockModeDescription')}
                </p>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
