/**
 * Testes Unitários para Validadores
 */

describe('Validadores de CPF/CNPJ', () => {
  // Função auxiliar para extrair apenas dígitos
  const onlyDigits = (s) => String(s || '').replace(/\D+/g, '');

  // Validador de CPF
  const isValidCPF = (cpf) => {
    const d = onlyDigits(cpf);
    if (d.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(d)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(d[i], 10) * (10 - i);
    let check1 = (sum * 10) % 11;
    if (check1 === 10) check1 = 0;
    if (check1 !== parseInt(d[9], 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(d[i], 10) * (11 - i);
    let check2 = (sum * 10) % 11;
    if (check2 === 10) check2 = 0;
    return check2 === parseInt(d[10], 10);
  };

  // Validador de CNPJ
  const isValidCNPJ = (cnpj) => {
    const d = onlyDigits(cnpj);
    if (d.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(d)) return false;

    const calc = (base) => {
      let pos = base.length - 7;
      let sum = 0;
      for (let i = base.length - 1; i >= 0; i--) {
        sum += parseInt(base[base.length - 1 - i], 10) * pos--;
        if (pos < 2) pos = 9;
      }
      const result = sum % 11;
      return result < 2 ? 0 : 11 - result;
    };

    const base12 = d.slice(0, 12);
    const dig1 = calc(base12);
    const base13 = d.slice(0, 12) + String(dig1);
    const dig2 = calc(base13);
    return d.endsWith(String(dig1) + String(dig2));
  };

  describe('isValidCPF', () => {
    test('deve validar CPF válido', () => {
      expect(isValidCPF('123.456.789-09')).toBe(true);
      expect(isValidCPF('12345678909')).toBe(true);
    });

    test('deve rejeitar CPF inválido', () => {
      expect(isValidCPF('123.456.789-00')).toBe(false);
      expect(isValidCPF('111.111.111-11')).toBe(false);
      expect(isValidCPF('000.000.000-00')).toBe(false);
    });

    test('deve rejeitar CPF com tamanho incorreto', () => {
      expect(isValidCPF('123.456.789')).toBe(false);
      expect(isValidCPF('123')).toBe(false);
    });
  });

  describe('isValidCNPJ', () => {
    test('deve validar CNPJ válido', () => {
      expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
      expect(isValidCNPJ('11222333000181')).toBe(true);
    });

    test('deve rejeitar CNPJ inválido', () => {
      expect(isValidCNPJ('11.222.333/0001-00')).toBe(false);
      expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
    });

    test('deve rejeitar CNPJ com tamanho incorreto', () => {
      expect(isValidCNPJ('11.222.333')).toBe(false);
      expect(isValidCNPJ('123')).toBe(false);
    });
  });
});

describe('Validadores de Telefone', () => {
  const onlyDigits = (s) => String(s || '').replace(/\D+/g, '');

  const isValidPhoneBR = (phone) => {
    const d = onlyDigits(phone);
    if (d.length < 10 || d.length > 11) return false;
    if (d.length === 11 && d[2] !== '9') return false;
    return true;
  };

  test('deve validar telefone fixo válido', () => {
    expect(isValidPhoneBR('(11) 3333-4444')).toBe(true);
    expect(isValidPhoneBR('1133334444')).toBe(true);
  });

  test('deve validar celular válido', () => {
    expect(isValidPhoneBR('(11) 98765-4321')).toBe(true);
    expect(isValidPhoneBR('11987654321')).toBe(true);
  });

  test('deve rejeitar telefone inválido', () => {
    expect(isValidPhoneBR('(11) 8765-4321')).toBe(false); // Celular sem 9
    expect(isValidPhoneBR('123')).toBe(false); // Muito curto
    expect(isValidPhoneBR('123456789012')).toBe(false); // Muito longo
  });
});

describe('Mascaramento de Dados Sensíveis', () => {
  const logger = require('../../../config/logger');

  test('deve mascarar email corretamente', () => {
    expect(logger.maskEmail('user@example.com')).toBe('u***@example.com');
    expect(logger.maskEmail('test@test.com')).toBe('t***@test.com');
  });

  test('deve mascarar CPF corretamente', () => {
    const masked = logger.maskCpfCnpj('123.456.789-09');
    expect(masked).toContain('***');
    expect(masked).not.toContain('123');
  });

  test('deve mascarar telefone corretamente', () => {
    const masked = logger.maskPhone('(11) 98765-4321');
    expect(masked).toContain('****');
    expect(masked).toContain('4321');
  });

  test('deve mascarar IP corretamente', () => {
    const masked = logger.maskIP('192.168.1.100');
    expect(masked).toBe('192.168.***.***');
  });

  test('deve mascarar objeto com dados sensíveis', () => {
    const obj = {
      name: 'João',
      email: 'joao@example.com',
      password: 'senha123',
      cpf: '123.456.789-09',
    };

    const masked = logger.maskSensitiveData(obj);
    expect(masked.name).toBe('João');
    expect(masked.email).toContain('***');
    expect(masked.password).toBe('***');
    expect(masked.cpf).toContain('***');
  });
});
