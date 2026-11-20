import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Auto-uppercase the input, strip non-alphanumeric except dash
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    // Auto-inject prefix if user is typing without it
    if (value.length > 0 && !value.startsWith('TEL-')) {
      if ('TEL-'.startsWith(value) || value.startsWith('TEL')) {
        // allow partial prefix
      } else {
        value = 'TEL-' + value.replace(/^TEL-?/, '');
      }
    }
    setInviteCode(value);
    setError('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const code = inviteCode.trim();
    if (!code) {
      setError('Please enter an invite code.');
      return;
    }
    // Validate format: TEL- followed by 6-10 alphanumeric chars
    const pattern = /^TEL-[A-Z0-9]{4,12}$/;
    if (!pattern.test(code)) {
      setError('Invalid invite code format. Example: TEL-ABCD1234');
      return;
    }
    navigate(`/room/${encodeURIComponent(code)}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
          <Monitor className="w-7 h-7 text-white" />
        </div>
        <span className="text-2xl font-bold text-foreground tracking-tight">Telnet</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold text-foreground mb-2 text-center">
          Join a screen share
        </h1>
        <p className="text-muted text-sm text-center mb-8">
          Enter the invite code shared by the host.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="invite-code"
              className="block text-xs font-medium text-muted mb-2 uppercase tracking-widest"
            >
              Invite Code
            </label>
            <input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={handleChange}
              placeholder="TEL-XXXXXXXX"
              maxLength={16}
              autoComplete="off"
              spellCheck={false}
              className={`w-full bg-background border rounded-lg px-4 py-3 text-foreground text-sm font-mono tracking-widest placeholder:text-muted/50 outline-none transition-colors ${
                error
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-border focus:border-accent'
              }`}
            />
            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Session
          </button>
        </form>
      </div>

      {/* Tagline */}
      <p className="mt-8 text-muted text-xs text-center">
        Telnet — Private screen sharing
      </p>
    </div>
  );
}
