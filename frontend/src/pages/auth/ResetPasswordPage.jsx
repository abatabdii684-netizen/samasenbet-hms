import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authAPI } from '@api/auth.api';
import toast from 'react-hot-toast';
import FormField from '@components/common/FormField';

function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password: data.password });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
        <p className="text-sm text-gray-500 mt-1">Enter your new password</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="New Password" error={errors.password?.message} required>
          <input type="password" className={`input ${errors.password ? 'input-error' : ''}`}
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })} />
        </FormField>
        <FormField label="Confirm Password" error={errors.confirmPassword?.message} required>
          <input type="password" className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
            {...register('confirmPassword', { required: 'Please confirm password',
              validate: (v) => v === watch('password') || 'Passwords do not match' })} />
        </FormField>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm text-primary-600 hover:underline">Back to Login</Link>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
