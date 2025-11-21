
export interface State {
    name: string;
    uf: string;
}

export const BRAZILIAN_STATES: State[] = [
    { name: 'Acre', uf: 'AC' },
    { name: 'Alagoas', uf: 'AL' },
    { name: 'Amapá', uf: 'AP' },
    { name: 'Amazonas', uf: 'AM' },
    { name: 'Bahia', uf: 'BA' },
    { name: 'Ceará', uf: 'CE' },
    { name: 'Distrito Federal', uf: 'DF' },
    { name: 'Espírito Santo', uf: 'ES' },
    { name: 'Goiás', uf: 'GO' },
    { name: 'Maranhão', uf: 'MA' },
    { name: 'Mato Grosso', uf: 'MT' },
    { name: 'Mato Grosso do Sul', uf: 'MS' },
    { name: 'Minas Gerais', uf: 'MG' },
    { name: 'Pará', uf: 'PA' },
    { name: 'Paraíba', uf: 'PB' },
    { name: 'Paraná', uf: 'PR' },
    { name: 'Pernambuco', uf: 'PE' },
    { name: 'Piauí', uf: 'PI' },
    { name: 'Rio de Janeiro', uf: 'RJ' },
    { name: 'Rio Grande do Norte', uf: 'RN' },
    { name: 'Rio Grande do Sul', uf: 'RS' },
    { name: 'Rondônia', uf: 'RO' },
    { name: 'Roraima', uf: 'RR' },
    { name: 'Santa Catarina', uf: 'SC' },
    { name: 'São Paulo', uf: 'SP' },
    { name: 'Sergipe', uf: 'SE' },
    { name: 'Tocantins', uf: 'TO' }
];

// A lista de cidades foi removida em favor da API do IBGE para garantir completude.

export const REGISTRIES_BY_CITY: Record<string, string[]> = {
    // SUDESTE
    'São Paulo': [
        '1º Oficial de Registro de Imóveis da Capital', '2º Oficial de Registro de Imóveis da Capital', '3º Oficial de Registro de Imóveis da Capital', '4º Oficial de Registro de Imóveis da Capital', '5º Oficial de Registro de Imóveis da Capital', '6º Oficial de Registro de Imóveis da Capital', '7º Oficial de Registro de Imóveis da Capital', '8º Oficial de Registro de Imóveis da Capital', '9º Oficial de Registro de Imóveis da Capital', '10º Oficial de Registro de Imóveis da Capital', '11º Oficial de Registro de Imóveis da Capital', '12º Oficial de Registro de Imóveis da Capital', '13º Oficial de Registro de Imóveis da Capital', '14º Oficial de Registro de Imóveis da Capital', '15º Oficial de Registro de Imóveis da Capital', '16º Oficial de Registro de Imóveis da Capital', '17º Oficial de Registro de Imóveis da Capital', '18º Oficial de Registro de Imóveis da Capital',
    ],
    'Rio de Janeiro': [
        '1º Ofício de Registro de Imóveis do Rio de Janeiro', '2º Ofício de Registro de Imóveis do Rio de Janeiro', '3º Ofício de Registro de Imóveis do Rio de Janeiro', '4º Ofício de Registro de Imóveis do Rio de Janeiro', '5º Ofício de Registro de Imóveis do Rio de Janeiro', '6º Ofício de Registro de Imóveis do Rio de Janeiro', '7º Ofício de Registro de Imóveis do Rio de Janeiro', '8º Ofício de Registro de Imóveis do Rio de Janeiro', '9º Ofício de Registro de Imóveis do Rio de Janeiro', '10º Ofício de Registro de Imóveis do Rio de Janeiro', '11º Ofício de Registro de Imóveis do Rio de Janeiro',
    ],
    'Belo Horizonte': [
        '1º Ofício de Registro de Imóveis de Belo Horizonte', '2º Ofício de Registro de Imóveis de Belo Horizonte', '3º Ofício de Registro de Imóveis de Belo Horizonte', '4º Ofício de Registro de Imóveis de Belo Horizonte', '5º Ofício de Registro de Imóveis de Belo Horizonte', '6º Ofício de Registro de Imóveis de Belo Horizonte', '7º Ofício de Registro de Imóveis de Belo Horizonte', 'Ofício de Registro de Imóveis do Barreiro',
    ],
    'Vitória': [
        'Cartório do 1º Ofício - Registro Geral de Imóveis de Vitória', 'Cartório do 2º Ofício de Registro de Imóveis', 'Cartório do 3º Ofício de Registro de Imóveis',
    ],
    'Campinas': [
        '1º Cartório de Registro de Imóveis de Campinas', '2º Cartório de Registro de Imóveis de Campinas', '3º Cartório de Registro de Imóveis de Campinas', '4º Cartório de Registro de Imóveis de Campinas',
    ],
    // SUL
    'Curitiba': [
        '1ª Circunscrição Imobiliária de Curitiba', '2ª Circunscrição Imobiliária de Curitiba', '3ª Circunscrição Imobiliária de Curitiba', '4ª Circunscrição Imobiliária de Curitiba', '5ª Circunscrição Imobiliária de Curitiba', '6ª Circunscrição Imobiliária de Curitiba', '7ª Circunscrição Imobiliária de Curitiba', '8ª Circunscrição Imobiliária de Curitiba', '9ª Circunscrição Imobiliária de Curitiba',
    ],
    'Porto Alegre': [
        'Registro de Imóveis da 1ª Zona de Porto Alegre', 'Registro de Imóveis da 2ª Zona de Porto Alegre', 'Registro de Imóveis da 3ª Zona de Porto Alegre', 'Registro de Imóveis da 4ª Zona de Porto Alegre', 'Registro de Imóveis da 5ª Zona de Porto Alegre', 'Registro de Imóveis da 6ª Zona de Porto Alegre',
    ],
    'Florianópolis': [
        '1º Ofício de Registro de Imóveis de Florianópolis', '2º Ofício de Registro de Imóveis de Florianópolis', '3º Ofício de Registro de Imóveis de Florianópolis',
    ],
    // CENTRO-OESTE
    'Brasília': [
        '1º Ofício de Registro de Imóveis do Distrito Federal', '2º Ofício de Registro de Imóveis do Distrito Federal', '3º Ofício de Registro de Imóveis do Distrito Federal', '4º Ofício de Registro de Imóveis do Distrito Federal (Guará)', '5º Ofício de Registro de Imóveis do Distrito Federal (Taguatinga)', '6º Ofício de Registro de Imóveis do Distrito Federal (Sobradinho)', '7º Ofício de Registro de Imóveis do Distrito Federal (Gama)',
    ],
    'Goiânia': [
        '1ª Circunscrição de Registro de Imóveis de Goiânia', '2ª Circunscrição de Registro de Imóveis de Goiânia', '3ª Circunscrição de Registro de Imóveis de Goiânia', '4ª Circunscrição de Registro de Imóveis de Goiânia',
    ],
    'Campo Grande': [
        '1ª Circunscrição Imobiliária de Campo Grande', '2ª Circunscrição Imobiliária de Campo Grande', '3ª Circunscrição Imobiliária de Campo Grande',
    ],
    'Cuiabá': [
        '1º Serviço Notarial e de Registro de Imóveis de Cuiabá', '2º Serviço Notarial e de Registro de Imóveis de Cuiabá', '5º Serviço Notarial e de Registro de Imóveis de Cuiabá', '6º Serviço Notarial e de Registro de Imóveis de Cuiabá', '7º Serviço Notarial e de Registro de Imóveis de Cuiabá',
    ],
    // NORDESTE
    'Salvador': [
        '1º Ofício de Registro de Imóveis de Salvador', '2º Ofício de Registro de Imóveis de Salvador', '3º Ofício de Registro de Imóveis de Salvador', '4º Ofício de Registro de Imóveis de Salvador', '5º Ofício de Registro de Imóveis de Salvador', '6º Ofício de Registro de Imóveis de Salvador', '7º Ofício de Registro de Imóveis de Salvador',
    ],
    'Fortaleza': [
        '1º Ofício de Registro de Imóveis de Fortaleza (Zona Leste)', '2º Ofício de Registro de Imóveis de Fortaleza (Zona Norte)', '3º Ofício de Registro de Imóveis de Fortaleza (Zona Sul)', '4º Ofício de Registro de Imóveis de Fortaleza (Zona Central)', '5º Ofício de Registro de Imóveis de Fortaleza (Zona Oeste)', '6º Ofício de Registro de Imóveis de Fortaleza (Messejana)',
    ],
    'Recife': [
        '1º Ofício de Registro de Imóveis do Recife', '2º Ofício de Registro de Imóveis do Recife', '3º Ofício de Registro de Imóveis do Recife', '4º Ofício de Registro de Imóveis do Recife', '5º Ofício de Registro de Imóveis do Recife',
    ],
    'São Luís': [
        '1º Ofício de Registro de Imóveis de São Luís', '2º Ofício de Registro de Imóveis de São Luís', '3º Ofício de Registro de Imóveis de São Luís', '4º Ofício de Registro de Imóveis de São Luís',
    ],
    'Maceió': [
        '1º Registro de Imóveis e Hipotecas de Maceió', '2º Registro de Imóveis e Hipotecas de Maceió', '3º Registro de Imóveis e Hipotecas de Maceió', '4º Registro de Imóveis e Hipotecas de Maceió', '5º Registro de Imóveis e Hipotecas de Maceió',
    ],
    'Natal': [
        '1º Ofício de Notas e Registro de Imóveis de Natal', '2º Ofício de Notas e Registro de Imóveis de Natal', '3º Ofício de Notas e Registro de Imóveis de Natal', '4º Ofício de Notas e Registro de Imávis de Natal', '5º Ofício de Notas e Registro de Imóveis de Natal', '6º Ofício de Notas e Registro de Imóveis de Natal', '7º Ofício de Notas e Registro de Imóveis de Natal',
    ],
    'Teresina': [
        'Cartório do 1º Ofício de Notas e Registro de Imóveis de Teresina', 'Cartório do 2º Ofício de Notas e Registros de Imóveis de Teresina',
    ],
    'João Pessoa': [
        'Cartório de Registro Geral de Imóveis Eunápio Torres (Zona Norte)', 'Cartório de Registro de Imóveis da Zona Sul',
    ],
    'Aracaju': [
        '1ª Circunscrição Imobiliária de Aracaju', '2ª Circunscrição Imobiliária de Aracaju', '3ª Circunscrição Imobiliária de Aracaju', '4ª Circunscrição Imobiliária de Aracaju', '5ª Circunscrição Imobiliária de Aracaju',
    ],
    // NORTE
    'Manaus': [
        '1º Ofício de Registro de Imóveis e Protesto de Letras de Manaus', '2º Ofício de Registro de Imóveis e Protesto de Letras de Manaus', '3º Ofício de Registro de Imóveis e Protesto de Letras de Manaus', '4º Ofício de Registro de Imóveis e Protesto de Letras de Manaus', '5º Ofício de Registro de Imóveis e Protesto de Letras de Manaus', '6º Ofício de Registro de Imóveis e Protesto de Letras de Manaus',
    ],
    'Belém': [
        'Cartório do 1º Ofício de Registro de Imóveis de Belém', 'Cartório do 2º Ofício de Registro de Imóveis de Belém',
    ],
    'Porto Velho': [
        '1º Ofício de Registro de Imóveis de Porto Velho', '2º Ofício de Registro de Imóveis de Porto Velho',
    ],
};
