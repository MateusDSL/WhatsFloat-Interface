// Exemplos de uso das novas validações implementadas nas API routes

// 1. Exemplo de requisição válida para chart-data
async function exemploChartDataValido() {
  const response = await fetch('/api/google-ads/chart-data?customerId=1234567890&dateFrom=2024-01-01&dateTo=2024-01-31');
  
  if (response.ok) {
    const data = await response.json();
    console.log('Dados do gráfico:', data);
  } else {
    const error = await response.json();
    console.error('Erro:', error);
  }
}

// 2. Exemplo de requisição inválida (falta dateTo)
async function exemploChartDataInvalido() {
  const response = await fetch('/api/google-ads/chart-data?customerId=1234567890&dateFrom=2024-01-01');
  
  // Retorna erro 400 com detalhes
  const error = await response.json();
  console.log('Erro de validação:', error);
  // {
  //   error: "Parâmetros inválidos",
  //   details: ["dateFrom: Ambas as datas (dateFrom e dateTo) devem ser fornecidas juntas"],
  //   help: "Verifique os parâmetros da requisição"
  // }
}

// 3. Exemplo de requisição com data inválida
async function exemploDataInvalida() {
  const response = await fetch('/api/google-ads/chart-data?customerId=1234567890&dateFrom=2024-13-01&dateTo=2024-01-31');
  
  const error = await response.json();
  console.log('Erro de data inválida:', error);
  // {
  //   error: "Parâmetros inválidos",
  //   details: ["dateFrom: Data inválida"],
  //   help: "Verifique os parâmetros da requisição"
  // }
}

// 4. Exemplo de requisição com customer ID inválido
async function exemploCustomerIdInvalido() {
  const response = await fetch('/api/google-ads/chart-data?customerId=abc123&dateFrom=2024-01-01&dateTo=2024-01-31');
  
  const error = await response.json();
  console.log('Erro de customer ID:', error);
  // {
  //   error: "Parâmetros inválidos",
  //   details: ["customerId: Customer ID deve ter 10-11 dígitos numéricos"],
  //   help: "Verifique os parâmetros da requisição"
  // }
}

// 5. Exemplo de requisição para campanhas
async function exemploCampanhas() {
  const response = await fetch('/api/google-ads/campaigns?type=campaigns&customerId=1234567890&dateFrom=2024-01-01&dateTo=2024-01-31');
  
  if (response.ok) {
    const data = await response.json();
    console.log('Dados das campanhas:', data);
  }
}

// 6. Exemplo de query customizada via POST
async function exemploQueryCustomizada() {
  const response = await fetch('/api/google-ads/campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'SELECT campaign.id, campaign.name FROM campaign WHERE campaign.status = "ENABLED"',
      customerId: '1234567890'
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('Resultado da query customizada:', data);
  } else {
    const error = await response.json();
    console.error('Erro na query:', error);
  }
}

// 7. Exemplo de requisição para demografia
async function exemploDemografia() {
  const response = await fetch('/api/google-ads/demographics?customerId=1234567890&dateFrom=2024-01-01&dateTo=2024-01-31');
  
  if (response.ok) {
    const data = await response.json();
    console.log('Dados demográficos:', data);
  }
}

// 8. Exemplo de requisição para dispositivos
async function exemploDispositivos() {
  const response = await fetch('/api/google-ads/devices?customerId=1234567890&dateFrom=2024-01-01&dateTo=2024-01-31');
  
  if (response.ok) {
    const data = await response.json();
    console.log('Dados de dispositivos:', data);
  }
}



// 10. Função helper para testar validações
async function testarValidacoes() {
  console.log('=== Testando Validações ===');
  
  // Teste 1: Requisição válida
  console.log('\n1. Testando requisição válida...');
  await exemploChartDataValido();
  
  // Teste 2: Requisição sem dateTo
  console.log('\n2. Testando requisição sem dateTo...');
  await exemploChartDataInvalido();
  
  // Teste 3: Data inválida
  console.log('\n3. Testando data inválida...');
  await exemploDataInvalida();
  
  // Teste 4: Customer ID inválido
  console.log('\n4. Testando customer ID inválido...');
  await exemploCustomerIdInvalido();
  
  // Teste 5: Query customizada
  console.log('\n5. Testando query customizada...');
  await exemploQueryCustomizada();
}

// 11. Exemplo de uso com React Hook
function useGoogleAdsData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (params: {
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (params.customerId) searchParams.append('customerId', params.customerId);
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);
      if (params.type) searchParams.append('type', params.type);

      const response = await fetch(`/api/google-ads/${params.type || 'chart-data'}?${searchParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na requisição');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData };
}

// 12. Exemplo de componente React usando as validações
function GoogleAdsChart({ customerId, dateFilter }: {
  customerId?: string;
  dateFilter: { from: Date | undefined; to: Date | undefined };
}) {
  const { data, loading, error, fetchData } = useGoogleAdsData();

  useEffect(() => {
    if (dateFilter.from && dateFilter.to) {
      const dateFrom = dateFilter.from.toISOString().split('T')[0];
      const dateTo = dateFilter.to.toISOString().split('T')[0];
      
      fetchData({
        customerId,
        dateFrom,
        dateTo,
        type: 'chart-data'
      });
    }
  }, [customerId, dateFilter.from, dateFilter.to]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!data) return <div>Nenhum dado disponível</div>;

  return (
    <div>
      {/* Renderizar gráfico com os dados */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

// Exportar exemplos para uso
export {
  exemploChartDataValido,
  exemploChartDataInvalido,
  exemploDataInvalida,
  exemploCustomerIdInvalido,
  exemploCampanhas,
  exemploQueryCustomizada,
  exemploDemografia,
  exemploDispositivos,
  exemploLocalizacao,
  testarValidacoes,
  useGoogleAdsData,
  GoogleAdsChart
};
