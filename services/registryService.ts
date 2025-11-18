import { REGISTRIES_BY_CITY } from '../data/locations';

/**
 * NOTA: Esta é uma simulação de um serviço de backend que consultaria o banco de dados do CNJ.
 * Uma integração direta do frontend com o site do CNJ não é viável devido a
 * restrições técnicas como políticas de CORS e a complexidade de web scraping. Em uma
 * aplicação real, essa lógica residiria em um servidor que busca e fornece
 * esses dados de forma segura para o cliente.
 */
export const findRegistriesByCity = async (state: string, city: string): Promise<string[]> => {
    console.log(`[CNJ Search Simulation] Searching for registries in ${city}, ${state}`);
    
    // Simula atraso de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verifica se temos dados pré-definidos para esta cidade
    if (REGISTRIES_BY_CITY[city]) {
        console.log(`[CNJ Search Simulation] Found ${REGISTRIES_BY_CITY[city].length} registries for ${city}.`);
        return REGISTRIES_BY_CITY[city];
    }

    // Para cidades sem dados específicos, fornece uma entrada genérica padrão.
    // Em uma aplicação real, o backend retornaria uma lista mais precisa ou vazia.
    console.log(`[CNJ Search Simulation] No specific data for ${city}. Returning default.`);
    return [`Cartório de Registro de Imóveis de ${city}`];
};
