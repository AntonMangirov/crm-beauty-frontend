// Тестовый файл для проверки работы mock API
import { mockServiceApi } from "./mockServiceApi";

export const testMockApi = async () => {
  console.log("🧪 Тестирование Mock API...\n");

  try {
    // 1. Получение всех услуг
    console.log("1️⃣ Получение всех услуг...");
    const services = await mockServiceApi.getServices();
    console.log(`✅ Найдено услуг: ${services.length}`);
    services.forEach((service) => {
      console.log(
        `  - ${service.name} (${service.price}₽, ${service.durationMin}мин)`
      );
    });

    // 2. Создание новой услуги
    console.log("\n2️⃣ Создание новой услуги...");
    const newService = await mockServiceApi.createService({
      name: "Тестовая услуга",
      price: 1000,
      durationMin: 30,
      description: "Описание тестовой услуги",
    });
    console.log(`✅ Создана услуга: ${newService.name} (ID: ${newService.id})`);

    // 3. Обновление услуги
    console.log("\n3️⃣ Обновление услуги...");
    const updatedService = await mockServiceApi.updateService(newService.id, {
      name: "Обновленная тестовая услуга",
      price: 1500,
    });
    console.log(
      `✅ Обновлена услуга: ${updatedService.name} (${updatedService.price}₽)`
    );

    // 4. Поиск услуг
    console.log("\n4️⃣ Поиск услуг...");
    const searchResults = await mockServiceApi.searchServices("тест");
    console.log(`✅ Найдено по поиску: ${searchResults.length} услуг`);

    // 5. Фильтрация активных услуг
    console.log("\n5️⃣ Фильтрация активных услуг...");
    const activeServices = await mockServiceApi.filterServices(true);
    console.log(`✅ Активных услуг: ${activeServices.length}`);

    // 6. Получение услуги по ID
    console.log("\n6️⃣ Получение услуги по ID...");
    const serviceById = await mockServiceApi.getServiceById(newService.id);
    console.log(`✅ Найдена услуга: ${serviceById.name}`);

    // 7. Удаление услуги
    console.log("\n7️⃣ Удаление услуги...");
    await mockServiceApi.deleteService(newService.id);
    console.log(`✅ Услуга удалена`);

    // 8. Проверка удаления
    console.log("\n8️⃣ Проверка удаления...");
    const servicesAfterDelete = await mockServiceApi.getServices();
    console.log(`✅ Услуг после удаления: ${servicesAfterDelete.length}`);

    console.log("\n🎉 Все тесты прошли успешно!");
  } catch (error) {
    console.error("❌ Ошибка тестирования:", error);
  }
};

// Функция для инициализации тестовых данных
export const initializeTestData = async () => {
  console.log("🌱 Инициализация тестовых данных...");
  try {
    await mockServiceApi.resetData();
    const services = await mockServiceApi.initializeMockData();
    console.log(`✅ Создано ${services.length} тестовых услуг`);
    return services;
  } catch (error) {
    console.error("❌ Ошибка инициализации:", error);
    return [];
  }
};
