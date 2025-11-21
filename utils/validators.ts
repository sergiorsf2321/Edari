
export const isValidCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/[^\d]+/g, '');

    if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) {
        return false;
    }

    const values = cleanCPF.split('').map(el => +el);
    const rest = (count: number) => (values.slice(0, count - 12).reduce((s, n, i) => s + n * (count - i), 0) * 10) % 11 % 10;

    return rest(10) === values[9] && rest(11) === values[10];
};

export const isValidCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/[^\d]+/g, '');

    if (cleanCNPJ.length !== 14 || !!cleanCNPJ.match(/(\d)\1{13}/)) {
        return false;
    }

    let size = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, size);
    const digits = cleanCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cleanCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
};

export const isValidCpfOrCnpj = (value: string): boolean => {
    const cleanValue = value.replace(/[^\d]+/g, '');
    if (cleanValue.length <= 11) {
        return isValidCPF(cleanValue);
    } else {
        return isValidCNPJ(cleanValue);
    }
};
