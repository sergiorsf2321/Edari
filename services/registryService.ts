
import { REGISTRIES_BY_CITY } from '../data/locations';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const findRegistriesByCity = async (state: string, city: string, type: 'imoveis' | 'civil' = 'imoveis'): Promise<string[]> => {
    await delay(600); // Simula busca na API

    if (type === 'civil') {
        // Simulação de lógica de cartórios civis (baseado na regra de negócio explicada anteriormente)
        const civilRegistries = [`Ofício de Registro Civil das Pessoas Naturais de ${city}`];
        
        // Simulando capitais/grandes cidades que geralmente têm subdistritos
        const bigCities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Fortaleza', 'Curitiba', 'Manaus', 'Recife', 'Porto Alegre', 'Brasília', 'Belém', 'Goiânia'];
        
        if (bigCities.includes(city)) {
            return [
                `1º Subdistrito de Registro Civil das Pessoas Naturais de ${city}`,
                `2º Subdistrito de Registro Civil das Pessoas Naturais de ${city}`,
                `3º Subdistrito de Registro Civil das Pessoas Naturais de ${city}`,
                ...civilRegistries
            ];
        }
        return civilRegistries;
    }

    // Lógica para Registro de Imóveis
    if (REGISTRIES_BY_CITY[city]) {
        return REGISTRIES_BY_CITY[city];
    }

    // Fallback genérico
    return [`Cartório de Registro de Imóveis de ${city}`];
};
