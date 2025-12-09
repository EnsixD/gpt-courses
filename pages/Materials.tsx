import React, { useState } from 'react';
import { Material } from '../types';
import { MATERIAL_CATEGORIES } from '../constants';
import { FileText, Plus, X, Upload } from 'lucide-react';

export const Materials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(MATERIAL_CATEGORIES[0]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  
  // Dynamic fields state
  const [companyName, setCompanyName] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [subject, setSubject] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const openForm = () => {
      setTitle('');
      setDescription('');
      setFileName('');
      setCompanyName('');
      setSupervisor('');
      setSubject('');
      setIsFormOpen(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct description with dynamic fields if needed
    let finalDescription = description;
    if (activeCategory === 'Договоры на практику' && companyName) {
        finalDescription = `Компания: ${companyName}. ${description}`;
    } else if (activeCategory === 'Дипломные проекты' && supervisor) {
        finalDescription = `Руководитель: ${supervisor}. ${description}`;
    } else if (activeCategory === 'Курсовые работы' && subject) {
        finalDescription = `Предмет: ${subject}. ${description}`;
    }

    const newMaterial: Material = {
      id: Date.now().toString(),
      title: title || 'Новый материал',
      category: activeCategory,
      description: finalDescription,
      dateAdded: new Date().toISOString(),
      fileName: fileName || undefined
    };
    setMaterials([...materials, newMaterial]);
    setIsFormOpen(false);
  };

  const filteredMaterials = materials.filter(m => m.category === activeCategory);

  const renderDynamicFields = () => {
      switch (activeCategory) {
          case 'Договоры на практику':
              return (
                  <div className="space-y-4 animate-fadeIn">
                       <div className="grid grid-cols-1 gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Название организации</label>
                            <input 
                                type="text" 
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                                placeholder="ООО 'Ромашка'"
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50"
                            />
                       </div>
                  </div>
              );
          case 'Дипломные проекты':
              return (
                  <div className="space-y-4 animate-fadeIn">
                       <div className="grid grid-cols-1 gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Научный руководитель</label>
                            <input 
                                type="text" 
                                value={supervisor}
                                onChange={e => setSupervisor(e.target.value)}
                                placeholder="Иванов И.И."
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50"
                            />
                       </div>
                  </div>
              );
          case 'Курсовые работы':
              return (
                   <div className="space-y-4 animate-fadeIn">
                       <div className="grid grid-cols-1 gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Дисциплина</label>
                            <input 
                                type="text" 
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Например: Программирование"
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50"
                            />
                       </div>
                  </div>
              );
          default:
              return null;
      }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm h-full flex flex-col overflow-hidden relative">
        <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
                <h2 className="text-2xl font-mono font-bold text-slate-800">Методические материалы</h2>
                <p className="text-sm text-slate-400 mt-1">Управление документами и ресурсами</p>
            </div>
            
            <button 
                onClick={openForm}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
                <Plus size={18} />
                Добавить
            </button>
        </div>

        {/* Categories Tabs - Wrapped Layout */}
        <div className="flex flex-wrap gap-2 mb-6 shrink-0">
            {MATERIAL_CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-lg border ${
                        activeCategory === cat 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105 z-10' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-2xl p-2 border border-slate-100">
            {filteredMaterials.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-2">
                        <FileText size={40} />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-600">Нет материалов</p>
                        <p className="text-sm opacity-70">В категории «{activeCategory}» пока пусто.</p>
                    </div>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                    {filteredMaterials.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                                <div className="bg-blue-50 p-3 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <FileText size={24} />
                                </div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                    {new Date(item.dateAdded).toLocaleDateString('ru-RU')}
                                </span>
                            </div>
                            
                            <h4 className="font-bold text-slate-800 mb-2 line-clamp-2 leading-tight">{item.title}</h4>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-3 flex-1">{item.description}</p>
                            
                            <div className="pt-3 border-t border-slate-100 mt-auto">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                    <span className="truncate max-w-[150px]">{item.fileName || 'Без файла'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Modal Form Overlay */}
        {isFormOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-full animate-slideUp">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Добавить материал</h3>
                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mt-1">{activeCategory}</p>
                        </div>
                        <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                         <div className="grid grid-cols-1 gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Название документа</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Введите название"
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50"
                                autoFocus
                            />
                        </div>

                        {renderDynamicFields()}

                        <div className="grid grid-cols-1 gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Описание</label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Краткое описание"
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Файл</label>
                            <label className="flex items-center gap-3 border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all group">
                                <div className="bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                                    <Upload size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600">
                                        {fileName ? fileName : 'Выберите файл'}
                                    </span>
                                    {!fileName && <span className="text-[10px] text-slate-400">Нажмите для загрузки</span>}
                                </div>
                                <input type="file" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>

                        <div className="pt-4 flex gap-3">
                             <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm uppercase">
                                Отмена
                             </button>
                             <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm uppercase">
                                Сохранить
                             </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};