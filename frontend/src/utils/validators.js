/**
 * VALIDADORES - FRONTEND
 *
 * IMPORTANTE: Este arquivo deve estar SINCRONIZADO com backend/utils/validators.js
 * Qualquer alteração na lógica de validação deve ser feita em AMBOS os arquivos.
 *
 * FONTE ÚNICA DE VERDADE: backend/utils/validators.js
 * Este arquivo (frontend) é uma cópia para validação client-side.
 */

export function onlyDigits(s) {
  return String(s || '').replace(/\D+/g, '');
}

export function isValidPhoneBR(phone) {
  const d = onlyDigits(phone);
  if (d.length < 10 || d.length > 11) return false;
  if (d.length === 11 && d[2] !== '9') return false;
  return true;
}

export function isValidCPF(cpf) {
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
}

export function isValidCNPJ(cnpj) {
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
}

export function isValidCpfOrCnpj(value) {
  const d = onlyDigits(value);
  if (d.length === 11) return isValidCPF(d);
  if (d.length === 14) return isValidCNPJ(d);
  return false;
}

export function formatCPF(value) {
  const d = onlyDigits(value).slice(0, 11);
  const part1 = d.slice(0, 3);
  const part2 = d.slice(3, 6);
  const part3 = d.slice(6, 9);
  const part4 = d.slice(9, 11);
  let out = '';
  if (part1) out = part1;
  if (part2) out += `.${part2}`;
  if (part3) out += `.${part3}`;
  if (part4) out += `-${part4}`;
  return out;
}

export function formatCNPJ(value) {
  const d = onlyDigits(value).slice(0, 14);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 8);
  const p4 = d.slice(8, 12);
  const p5 = d.slice(12, 14);
  let out = '';
  if (p1) out = p1;
  if (p2) out += `.${p2}`;
  if (p3) out += `.${p3}`;
  if (p4) out += `/${p4}`;
  if (p5) out += `-${p5}`;
  return out;
}

export function formatCpfCnpj(value) {
  const d = onlyDigits(value);
  if (d.length <= 11) return formatCPF(d);
  return formatCNPJ(d);
}

export function formatPhoneBR(value) {
  const d = onlyDigits(value).slice(0, 11);
  const dd = d.slice(0, 2);
  const p1 = d.length === 11 ? d.slice(2, 7) : d.slice(2, 6);
  const p2 = d.length === 11 ? d.slice(7, 11) : d.slice(6, 10);
  let out = '';
  if (dd) out = `(${dd})`;
  if (p1) out += ` ${p1}`;
  if (p2) out += `-${p2}`;
  return out;
}

export function formatCEP(value) {
  const d = onlyDigits(value).slice(0, 8);
  const p1 = d.slice(0, 5);
  const p2 = d.slice(5, 8);
  let out = '';
  if (p1) out = p1;
  if (p2) out += `-${p2}`;
  return out;
}
