import { type Service } from "../api/me";

export interface ParsedText {
  name?: string;
  contact?: string;
  contactType?: "phone" | "telegram";
  time?: string; // Формат HH:mm
  serviceName?: string;
}

/**
 * Парсит текст из буфера обмена и извлекает информацию о записи
 * Примеры:
 * - "Катя @kate 14:00 ресницы"
 * - "Иван +79991234567 15:30 маникюр"
 * - "Мария 16:00 педикюр"
 * - "Анна @anna 10:00"
 */
export const parseBookingText = (
  text: string,
  availableServices: Service[]
): ParsedText => {
  const result: ParsedText = {};
  const trimmedText = text.trim();

  if (!trimmedText) {
    return result;
  }

  // Разбиваем текст на слова
  const words = trimmedText.split(/\s+/);

  // Ищем время в формате HH:mm или H:mm
  const timeRegex = /(\d{1,2}):(\d{2})/;
  let timeMatch: RegExpMatchArray | null = null;
  let timeIndex = -1;

  for (let i = 0; i < words.length; i++) {
    const match = words[i].match(timeRegex);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        timeMatch = match;
        timeIndex = i;
        break;
      }
    }
  }

  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    result.time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  // Ищем контакт (телефон или Telegram)
  let contactIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (i === timeIndex) continue; // Пропускаем время

    const word = words[i];

    // Проверяем на Telegram (@username)
    if (word.startsWith("@")) {
      result.contact = word.replace(/^@+/, ""); // Убираем @
      result.contactType = "telegram";
      contactIndex = i;
      break;
    }

    // Проверяем на телефон (содержит цифры и может начинаться с +)
    const phoneRegex = /^\+?[\d\s()-]+$/;
    const digitsOnly = word.replace(/[^\d+]/g, "");
    if (phoneRegex.test(word) && digitsOnly.length >= 10) {
      result.contact = word;
      result.contactType = "phone";
      contactIndex = i;
      break;
    }
  }

  // Ищем услугу (последнее слово, которое не является именем, контактом или временем)
  // Или ищем по частичному совпадению с названиями услуг
  let serviceIndex = -1;
  for (let i = words.length - 1; i >= 0; i--) {
    if (i === timeIndex || i === contactIndex) continue;

    const word = words[i].toLowerCase();
    // Ищем услугу по частичному совпадению
    const matchedService = availableServices.find((service) =>
      service.name.toLowerCase().includes(word)
    );

    if (matchedService) {
      result.serviceName = matchedService.name;
      serviceIndex = i;
      break;
    }
  }

  // Если услуга не найдена, берем последнее слово (кроме времени и контакта)
  if (!result.serviceName) {
    for (let i = words.length - 1; i >= 0; i--) {
      if (i !== timeIndex && i !== contactIndex && words[i].length > 2) {
        result.serviceName = words[i];
        serviceIndex = i;
        break;
      }
    }
  }

  // Имя - первое слово, которое не является контактом, временем или услугой
  for (let i = 0; i < words.length; i++) {
    if (i !== timeIndex && i !== contactIndex && i !== serviceIndex) {
      const word = words[i];
      // Пропускаем короткие слова и слова, похожие на контакты/время
      if (
        word.length >= 2 &&
        !word.match(/^\d+$/) &&
        !word.match(/^@/) &&
        !word.match(/^\+?[\d\s()-]+$/)
      ) {
        result.name = word;
        break;
      }
    }
  }

  return result;
};


