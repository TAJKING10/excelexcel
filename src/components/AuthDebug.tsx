import { useAuth } from '@/contexts/AuthContext';

export default function AuthDebug() {
  const { loading, user, session } = useAuth();

  return (
    <pre
      style={{
        position: 'fixed',
        bottom: 8,
        right: 8,
        background: 'rgba(0,0,0,.8)',
        color: '#0f0',
        padding: 12,
        fontSize: 11,
        zIndex: 999999,
        borderRadius: 8,
        maxWidth: 300,
        overflow: 'auto',
      }}
    >
      {JSON.stringify(
        {
          loading,
          hasUser: !!user,
          hasSession: !!session,
          userRole: user?.role,
          userEmail: user?.email,
        },
        null,
        2
      )}
    </pre>
  );
}
