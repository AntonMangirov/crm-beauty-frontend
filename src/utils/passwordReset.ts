/**
 * Утилиты для работы с восстановлением пароля на фронтенде
 */

export const validatePhone = (phone: string): boolean => {
  // Удаляем все нецифровые символы кроме +
  const cleaned = phone.replace(/[^\d+]/g, "");
  // Проверяем формат +7XXXXXXXXXX (11 цифр после +7)
  return cleaned.startsWith("+7") && cleaned.length === 12;
};

export const formatPhoneForDisplay = (phone: string): string => {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+7") && cleaned.length === 12) {
    const digits = cleaned.slice(2);
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  }
  return phone;
};



