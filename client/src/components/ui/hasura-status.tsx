import { useEffect, useState } from 'react';
import { hasuraClient } from '@/lib/hasura';
import { Badge } from './badge';
import { gql } from 'graphql-request';

const HASURA_HEALTH_CHECK = gql`
  query HasuraHealthCheck {
    __typename
  }
`;

export function HasuraStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await hasuraClient.request(HASURA_HEALTH_CHECK);
        setStatus('connected');
      } catch (error) {
        console.error('Erro na conexão com Hasura:', error);
        setStatus('error');
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Hasura:</span>
      {status === 'loading' && (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Conectando...
        </Badge>
      )}
      {status === 'connected' && (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Conectado
        </Badge>
      )}
      {status === 'error' && (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          Erro
        </Badge>
      )}
    </div>
  );
}