/**
 * VALIDADORES CENTRALIZADOS
 *
 * FONTE ÚNICA DE VERDADE para validações de documentos e telefone.
 * Este arquivo elimina duplicação entre frontend e backend.
 *
 * IMPORTANTE: Qualquer alteração aqui deve ser sincronizada com frontend/src/utils/validators.js
 */

/**
 * Remove todos os caracteres não numéricos
 */
function onlyDigits(s) {
  return String(s || '').replace(/\D+/g, '');
}

/**
 * Valida telefone brasileiro (formato: DDD + número)
 * Aceita: (11) 98888-8888 ou (11) 3888-8888
 */
function isValidPhoneBR(phone) {
  const d = onlyDigits(phone);
  if (d.length < 10 || d.length > 11) return false;
  // Se tem 11 dígitos, o terceiro deve ser 9 (celular)
  if (d.length === 11 && d[2] !== '9') return false;
  return true;
}

/**
 * Valida CPF brasileiro
 * Algoritmo oficial da Receita Federal
 */
function isValidCPF(cpf) {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return false;
  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(d)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(d[i], 10) * (10 - i);
  }
  let check1 = (sum * 10) % 11;
  if (check1 === 10) check1 = 0;
  if (check1 !== parseInt(d[9], 10)) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(d[i], 10) * (11 - i);
  }
  let check2 = (sum * 10) % 11;
  if (check2 === 10) check2 = 0;
  return check2 === parseInt(d[10], 10);
}

/**
 * Valida CNPJ brasileiro
 * Algoritmo oficial da Receita Federal
 */
function isValidCNPJ(cnpj) {
  const d = onlyDigits(cnpj);
  if (d.length !== 14) return false;
  // Rejeita CNPJs com todos os dígitos iguais
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
}

/**
 * Valida CPF ou CNPJ automaticamente
 * Detecta o tipo pelo tamanho (11 dígitos = CPF, 14 = CNPJ)
 */
function isValidCpfOrCnpj(value) {
  const d = onlyDigits(value);
  if (d.length === 11) return isValidCPF(d);
  if (d.length === 14) return isValidCNPJ(d);
  return false;
}

module.exports = {
  onlyDigits,
  isValidPhoneBR,
  isValidCPF,
  isValidCNPJ,
  isValidCpfOrCnpj,
};
