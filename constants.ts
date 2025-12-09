
import { Role, User, Material, Reminder } from './types';

// In production (built app served by Express), use relative path (empty string).
// In development, use localhost:3001.
export const API_URL = (import.meta as any).env?.PROD ? '' : 'http://localhost:3001';

export const USERS: User[] = [
  { id: '1', username: 'student', name: 'Студент Иванов', role: Role.STUDENT },
  { id: '2', username: 'teacher', name: 'Преподаватель Петров', role: Role.TEACHER },
  { id: '3', username: 'admin', name: 'Администратор Системы', role: Role.ADMIN },
];

export const MATERIAL_CATEGORIES = [
  'Договоры на практику',
  'Дипломные проекты',
  'Курсовые работы',
  'Отчеты',
  'Методические указания',
  'Образцы документов',
  'Другое'
];

export const INITIAL_MATERIALS: Material[] = [];

// Departments and Groups Data
export const GROUPS_DATA = {
  "ОИКТ": [
    { id: "173", name: "ИС-1/25" },
    { id: "157", name: "ИС-2/24" },
    { id: "176", name: "ИС-2/25" },
    { id: "114", name: "ИС-3/23" },
    { id: "158", name: "ИС-3/24" },
    { id: "100", name: "ИС-4/22" },
    { id: "115", name: "ИС-4/23" },
    { id: "174", name: "АТ-1/25" },
    { id: "165", name: "АТ-1/25-Э" },
    { id: "148", name: "АТ-2/24-Э" },
    { id: "112", name: "АТ-3/23-Э" },
    { id: "126", name: "АТ-4/22" },
    { id: "168", name: "ПК-1/25" },
    { id: "151", name: "ПК-2/24" },
    { id: "120", name: "ПК-3/23" },
    { id: "105", name: "ПК-4/22" },
    { id: "166", name: "СА-1/25" },
    { id: "149", name: "СА-2/24" },
  ],
  "ОСУ": [
    { id: "167", name: "КМ-1//25" },
    { id: "150", name: "КМ-2/24" },
    { id: "116", name: "КМ-3/23" },
    { id: "103", name: "КМ-4/22" },
    { id: "179", name: "ФА-1/25" },
    { id: "156", name: "ФА-2/24" },
    { id: "124", name: "ФА-3/23" },
    { id: "175", name: "ОЛ-1/25-А" },
    { id: "147", name: "ОЛ-2/24-А" },
    { id: "178", name: "ОЛ-2/25-А" },
    { id: "118", name: "ОЛ-3/23" },
    { id: "160", name: "ОЛ-3/24-А" },
    { id: "170", name: "ЭО-1/25-А" },
    { id: "153", name: "ЭО-2/24-А" },
  ],
  "ОПИТ": [
    { id: "172", name: "ТМ-1/25-А" },
    { id: "171", name: "ТМ-1/25-К" },
    { id: "155", name: "ТМ-2/24-А" },
    { id: "154", name: "ТМ-2/24-К" },
    { id: "177", name: "ТМ-2/25-Э" },
    { id: "121", name: "ТМ-3/23" },
    { id: "132", name: "ТМ-3/23-К" },
    { id: "159", name: "ТМ-3/24-Э" },
    { id: "135", name: "ТМ-4/22-1" },
    { id: "136", name: "ТМ-4/22-2" },
    { id: "137", name: "ТМ-4/23-А" },
    { id: "123", name: "ТЭ-3/23" },
    { id: "101", name: "ТЭ-4/22" },
    { id: "169", name: "МР-1/25" },
    { id: "152", name: "МР-2/24" },
    { id: "117", name: "МО-3/23-Э" },
    { id: "102", name: "МО-4/22" },
    { id: "164", name: "16-Н" },
    { id: "162", name: "17-П" },
    { id: "163", name: "17-ПО" },
    { id: "146", name: "26-Н" },
  ]
};
