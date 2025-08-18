// Exemplo de como testar a API da Goalfy
// Este arquivo pode ser executado com: npx tsx examples/api-test.ts

async function testGoalfyAPI() {
  console.log('🧪 Testando API da Goalfy...\n');

  const baseUrl = 'http://localhost:3000/api/goalfy';

  // Teste 1: Buscar lista de boards
  console.log('1️⃣ Testando busca de boards...');
  try {
    const boardsResponse = await fetch(`${baseUrl}?type=boards`);
    const boardsData = await boardsResponse.json();
    
    if (boardsResponse.ok) {
      console.log('✅ Boards encontrados:', boardsData.data?.length || 0);
      console.log('📋 Dados:', JSON.stringify(boardsData, null, 2));
    } else {
      console.log('❌ Erro ao buscar boards:', boardsData);
    }
  } catch (error) {
    console.log('❌ Erro na requisição de boards:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste 2: Buscar lista de relatórios
  console.log('2️⃣ Testando busca de relatórios...');
  try {
    const reportsResponse = await fetch(`${baseUrl}?type=reports`);
    const reportsData = await reportsResponse.json();
    
    if (reportsResponse.ok) {
      console.log('✅ Relatórios encontrados:', reportsData.data?.length || 0);
      console.log('📋 Dados:', JSON.stringify(reportsData, null, 2));
    } else {
      console.log('❌ Erro ao buscar relatórios:', reportsData);
    }
  } catch (error) {
    console.log('❌ Erro na requisição de relatórios:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste 3: Teste com tipo inválido
  console.log('3️⃣ Testando tipo inválido...');
  try {
    const invalidResponse = await fetch(`${baseUrl}?type=invalid`);
    const invalidData = await invalidResponse.json();
    
    console.log('📋 Resposta esperada (erro):', JSON.stringify(invalidData, null, 2));
  } catch (error) {
    console.log('❌ Erro na requisição inválida:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste 4: Teste sem parâmetros
  console.log('4️⃣ Testando sem parâmetros...');
  try {
    const noParamsResponse = await fetch(baseUrl);
    const noParamsData = await noParamsResponse.json();
    
    console.log('📋 Resposta esperada (erro):', JSON.stringify(noParamsData, null, 2));
  } catch (error) {
    console.log('❌ Erro na requisição sem parâmetros:', error);
  }

  console.log('\n🎉 Testes concluídos!');
}

// Executar os testes se o arquivo for executado diretamente
if (require.main === module) {
  testGoalfyAPI().catch(console.error);
}

export { testGoalfyAPI };

