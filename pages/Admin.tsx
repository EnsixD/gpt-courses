import React, { useState, useEffect } from "react";
import { API_URL, GROUPS_DATA } from "../constants";
import {
  Plus,
  KeyRound,
  Edit,
  Check,
  X,
  Clock,
  Save,
  Loader2,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Enrollment, User, Role } from "../types";

export const Admin: React.FC = () => {
  // ... [State declarations remain unchanged] ...
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Enrollment[]>([]);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editGroupId, setEditGroupId] = useState<string>("0");
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserLogin, setNewUserLogin] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>(Role.STUDENT);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/enrollments/pending`);
      if (res.ok) setPendingRequests(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "requests") fetchRequests();
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          username: newUserLogin,
          password: newUserPass,
          role: newUserRole,
        }),
      });
      if (res.ok) {
        await fetchUsers();
        setIsCreateUserModalOpen(false);
        setNewUserName("");
        setNewUserLogin("");
        setNewUserPass("");
      } else {
        alert((await res.json()).error || "Ошибка создания");
      }
    } catch (e) {
      alert("Ошибка сервера");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Удалить пользователя?")) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/enrollments/${id}/approve`, {
        method: "POST",
      });
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Отклонить заявку?")) return;
    try {
      await fetch(`${API_URL}/api/enrollments/${id}/reject`, {
        method: "POST",
      });
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const openEditUser = async (user: User) => {
    setEditingUser(user);
    setEditGroupId("0");
    try {
      const res = await fetch(`${API_URL}/api/settings/${user.username}`);
      if (res.ok) {
        const data = await res.json();
        if (data.groupId) setEditGroupId(data.groupId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveEditedUser = async () => {
    if (!editingUser) return;
    setIsSavingUser(true);
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editingUser.username,
          groupId: editGroupId,
        }),
      });
      if (res.ok) {
        alert(`Группа для пользователя ${editingUser.name} обновлена.`);
        setEditingUser(null);
      }
    } catch (e) {
      alert("Ошибка сохранения");
    } finally {
      setIsSavingUser(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 md:p-8 shadow-sm h-full overflow-y-auto relative">
      <h2 className="text-xl md:text-2xl font-mono font-bold text-slate-800 mb-2">
        Админская панель
      </h2>
      <p className="text-sm text-slate-400 mb-8">Управление системой.</p>

      <div className="flex gap-2 mb-8 border-b border-slate-100 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 md:px-6 py-2.5 rounded-t-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
            activeTab === "users"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Пользователи
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 md:px-6 py-2.5 rounded-t-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
            activeTab === "requests"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Заявки
          {pendingRequests.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "users" && (
        <div className="animate-fadeIn space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-700">Пользователи</h3>
            <button
              onClick={() => setIsCreateUserModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <UserPlus size={16} />
              Создать
            </button>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
            {/* Table wrapper for horizontal scroll on mobile */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-bold pl-6">Имя</th>
                    <th className="p-4 font-bold">Роль</th>
                    <th className="p-4 font-bold text-right pr-6">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-white transition-colors group"
                    >
                      <td className="p-4 pl-6 font-bold text-slate-700">
                        {user.name}
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          {user.username}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                            user.role === "admin"
                              ? "bg-slate-800 text-white border-slate-800"
                              : user.role === "teacher"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right flex justify-end gap-2">
                        <button
                          onClick={() => openEditUser(user)}
                          className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Редактировать"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ... [Requests tab and Modals logic remains similar but with minor responsive padding tweaks if needed] ... */}
      {activeTab === "requests" && (
        <div className="animate-fadeIn space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-700">Заявки</h3>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="font-bold">Нет новых заявок</div>
              <div className="text-xs mt-1 opacity-60">
                Все студенты распределены.
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">
                        {req.username}
                      </div>
                      <div className="text-xs text-slate-500">
                        Хочет на курс:{" "}
                        <span className="font-bold text-blue-600">
                          {req.courseTitle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end md:self-auto">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="p-2 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-colors"
                      title="Принять"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                      title="Отклонить"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit User Modals (Ensure full width on mobile) */}
      {/* ... Same modal code, handled by max-w-md and w-full which is already responsive ... */}
      {isCreateUserModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-slideUp">
            {/* ... Modal content ... */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Новый пользователь</h3>
              <button
                onClick={() => setIsCreateUserModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  ФИО
                </label>
                <input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Иванов Иван"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Логин
                </label>
                <input
                  value={newUserLogin}
                  onChange={(e) => setNewUserLogin(e.target.value)}
                  placeholder="login123"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Пароль
                </label>
                <input
                  type="password"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  placeholder="******"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Роль
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium"
                >
                  <option value={Role.STUDENT}>Студент</option>
                  <option value={Role.TEACHER}>Преподаватель</option>
                  <option value={Role.ADMIN}>Администратор</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreatingUser}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {isCreatingUser ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Создать"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-slideUp">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Редактирование</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Имя
                </label>
                <input
                  disabled
                  value={editingUser.name}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 font-medium"
                />
              </div>
              {editingUser.role === Role.STUDENT && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Группа
                  </label>
                  <select
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="0">Без группы</option>
                    {Object.entries(GROUPS_DATA).map(([dept, groups]) => (
                      <optgroup key={dept} label={dept}>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={saveEditedUser}
                disabled={isSavingUser}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {isSavingUser ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    {" "}
                    <Save size={18} /> Сохранить{" "}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
