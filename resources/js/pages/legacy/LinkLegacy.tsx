import React from 'react';
import { useForm, usePage } from '@inertiajs/react';

const LinkLegacy: React.FC = () => {
  const { props } = usePage();
  const { linked, status, lastValidatedAt, lastError } = props as any;
  const form = useForm({ legacy_username: '', legacy_password: '' });

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Link Legacy Account</h1>
      {linked ? (
        <div className="space-y-4">
          <div className="p-4 rounded border bg-green-50">
            <p className="font-medium">Linked status: {status}</p>
            {lastValidatedAt && <p>Last validated: {lastValidatedAt}</p>}
            {lastError && <p className="text-red-600">Last error: {lastError}</p>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.delete(route('legacy.link.unlink'));
            }}
          >
            <button className="px-4 py-2 bg-red-600 text-white rounded" type="submit">Unlink</button>
          </form>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.post(route('legacy.link.submit'));
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium">Legacy Username</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={form.data.legacy_username}
              onChange={(e) => form.setData('legacy_username', e.target.value)}
              required
            />
            {form.errors.legacy_username && (
              <p className="text-red-600 text-sm">{form.errors.legacy_username}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Legacy Password</label>
            <input
              type="password"
              className="mt-1 w-full border rounded px-3 py-2"
              value={form.data.legacy_password}
              onChange={(e) => form.setData('legacy_password', e.target.value)}
              required
            />
            {form.errors.legacy_password && (
              <p className="text-red-600 text-sm">{form.errors.legacy_password}</p>
            )}
          </div>
          <button
            disabled={form.processing}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            type="submit"
          >
            {form.processing ? 'Linking...' : 'Link Legacy Account'}
          </button>
        </form>
      )}
    </div>
  );
};

export default LinkLegacy;
