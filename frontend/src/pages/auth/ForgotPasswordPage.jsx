import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authAPI } from '@api/auth.api';
import toast from 'react-hot-toast';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import FormField from '@components/common/FormField';

function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(data);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-3">
          <EnvelopeIcon className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Check your email</h2>
        <p className="text-sm text-gray-500 mt-2">We've sent a password reset link to your email address.</p>
        <Link to="/login" className="btn-primary mt-6 inline-flex">Back to Login</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
        <p className="text-sm text-gray-500 mt-1">Enter your email to receive a reset link</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email Address" error={errors.email?.message} required>
          <input
            type="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="your@email.com"
            {...register('email', { required: 'Email is required' })}
          />
        </FormField>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm text-primary-600 hover:underline flex items-center justify-center gap-1">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
