import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { Sprout, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message || "Reset link has been prepared.");
    } catch (e) {
      setMessage("Reset instructions prepared. Use the demo credentials provided on the login page for instant access.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-100 shadow-premium text-center">
        <div className="w-12 h-12 rounded-2xl bg-forest text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-forest/20">
          <Sprout className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-charcoal">Reset Password</h2>
        <p className="text-xs text-gray-500 mt-1 mb-6">Enter your registered email to receive account recovery details</p>

        {message ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs text-left space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald" />
              <span>Password Recovery Ready</span>
            </div>
            <p>{message}</p>
            <div className="pt-2 border-t border-emerald-100">
              <Link to="/login" className="font-bold text-forest hover:underline">
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-forest hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-md shadow-forest/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Processing...' : 'Send Recovery Instructions'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-gray-500 hover:text-forest">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
