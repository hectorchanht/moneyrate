import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { DefaultCurrency2Display } from '@/lib/constants';
import { getDataFromLocalStorage } from '@/lib/fns';
import { AddSvg, CrossSvg, ListSvg, SettingSvg, TableSvg, XSvg } from '@/lib/svgs';
import { Language } from '@/lib/types';
import React, { useState } from 'react'; // Add useState import
import CountryImg from './CountryImg';


interface CurrencyListModalProps {
  data: Record<string, string>;
  currency2Display: string[];
  removeCurrency2Display: (params: { name: string }) => void;
  addCurrency2Display: (params: { name: string }) => void;

  isDefaultCurrencyValue: boolean;
  setIsDefaultCurrencyValue: (params: boolean) => void;
  defaultCurrencyValue: number;
  setDefaultCurrencyValue: (params: number) => void;
  isEditing: boolean;
  setIsEditing: (params: boolean) => void;
}

interface CurrencyListTableProps {
  data: Record<string, string>;
  currency2Display: string[];
  removeCurrency2Display: (params: { name: string }) => void;
  addCurrency2Display: (params: { name: string }) => void;
}

interface CurrencySettingProps {
  isDefaultCurrencyValue: boolean;
  setIsDefaultCurrencyValue: (params: boolean) => void;
  defaultCurrencyValue: number;
  setDefaultCurrencyValue: (params: number) => void;
  isEditing: boolean;
  setIsEditing: (params: boolean) => void;
}

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'ar', label: 'العربية' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'bn', label: 'বাংলা' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
  { value: 'ur', label: 'اردو' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'th', label: 'ไทย' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'sv', label: 'Svenska' },
  { value: 'no', label: 'Norsk' },
  { value: 'da', label: 'Dansk' },
  { value: 'fi', label: 'Suomi' },
  { value: 'pl', label: 'Polski' },
  { value: 'ro', label: 'Română' },
  { value: 'sk', label: 'Slovenčina' },
  { value: 'sl', label: 'Slovenščina' },
  { value: 'tr', label: 'Türkçe' },
]

const CurrencySetting: React.FC<CurrencySettingProps> = ({
  isDefaultCurrencyValue, defaultCurrencyValue, setIsDefaultCurrencyValue, setDefaultCurrencyValue, isEditing, setIsEditing
}) => {
  const [currency2Display, setCurrency2Display] = useState<string[]>(getDataFromLocalStorage('currency2Display', DefaultCurrency2Display));
  const { language, setLanguage } = useLanguage();
  const t = useTranslation();

  return (
    <div>
      <div className="form-control">
        <label className="label cursor-pointer">
          <input type="checkbox" checked={isEditing} onChange={() => {
            setIsEditing(!isEditing);
          }} className="checkbox" />
          <span className="label-text px-2">
            {t.settings.enableDeleteDragAndDrop}
          </span>
        </label>

        <div className="divider m-0" />

        <label className="label cursor-pointer">
          <input type="checkbox" checked={isDefaultCurrencyValue} onChange={() => {
            setIsDefaultCurrencyValue(!isDefaultCurrencyValue);
          }} className="checkbox" />
          <span className="label-text pl-2 justify-between items-center flex gap-2">
            {t.settings.resetValue}
            <input type="number" className="w-[50%] bg-black" placeholder={defaultCurrencyValue.toString()} disabled={!isDefaultCurrencyValue}
              onChange={(d) => {
                setDefaultCurrencyValue(parseInt(d.target.value));
              }}
            />
          </span>
        </label>

        <div className="divider m-0" />

        <label className="label">
          <span className="label-text">{t.settings.changeLanguage}</span>
        </label>
        <select
          className="select select-bordered w-full mt-2"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          {languageOptions.map(({ value, label }) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>

        <div className="divider m-0" />

        <label className="label">
          <span className="label-text">{t.settings.currenciesToDisplay}</span>
        </label>
        <input type="text" className="input input-bordered rounded-none w-full mt-2" placeholder={t.settings.currenciesToDisplaySeparatedByComma}
          value={currency2Display.filter(Boolean).join(',')}
          onChange={(d) => {
            setCurrency2Display(d.target.value.split(',').map(c => c.trim()).filter(Boolean));
          }} />

        <button className="btn btn-primary w-full mt-2" onClick={() => {
          localStorage.clear(); // Clear all local storage
          localStorage.setItem('currency2Display', JSON.stringify(currency2Display.length > 0 ? currency2Display : DefaultCurrency2Display));
          localStorage.setItem('language', language);
          window.location.reload(); // Refresh the page
        }}>
          {t.settings.reset}
        </button>

      </div>
    </div>
  )
};

const MemoizedCurrencySetting = React.memo(CurrencySetting, (prev, next) => {
  return prev.isDefaultCurrencyValue === next.isDefaultCurrencyValue
    && prev.defaultCurrencyValue === next.defaultCurrencyValue
    && prev.isEditing === next.isEditing;
});


const CurrencyListTable: React.FC<CurrencyListTableProps> = ({
  data, addCurrency2Display, currency2Display, removeCurrency2Display
}) => {
  const t = useTranslation();
  return <div className="overflow-x-auto">
    <table className="table">
      <thead>
        <tr>
          <td></td>
          <td></td>
          <th>{t.settings.code}</th>
          <th>{t.settings.name}</th>
        </tr>
      </thead>
      <tbody>
        {data && Object.entries(data).map(([code, name]) => {
          return <tr className="hover" key={code}>
            <td className='py-0 pl-0'>
              {
                currency2Display.includes(code)
                  ? <CrossSvg className={'cursor-pointer size-6'} onClick={() => removeCurrency2Display({ name: code })} />
                  : <AddSvg className={'cursor-pointer size-6'} onClick={() => addCurrency2Display({ name: code })} />
              }
            </td>
            <td className='p-0'><CountryImg code={code} /></td>
            <td className='px-0 text-center'>{code}</td>
            <td className='px-0 truncate' title={name}>{name}</td>
          </tr>
        })}
      </tbody>
    </table>
  </div>
};

// const MemoizedCurrencyListTable = React.memo(CurrencyListTable, (prev, next) => {
//   return prev.currency2Display === next.currency2Display;
// });


const CurrencyListModal: React.FC<CurrencyListModalProps> = ({
  data, currency2Display, removeCurrency2Display, addCurrency2Display,
  isDefaultCurrencyValue, defaultCurrencyValue, setIsDefaultCurrencyValue, setDefaultCurrencyValue,
  isEditing, setIsEditing
}) => {
  const [activeTab, setActiveTab] = useState(1); // Add state for active tab

  const openModal = () => {
    const modal = document.getElementById('currency_list_modal') as HTMLDialogElement;
    modal?.showModal();
  };

  const closeModal = () => {
    const modal = document.getElementById('currency_list_modal') as HTMLDialogElement;
    modal?.close();
  };

  return (
    <div className='mx-auto container max-w-[800px]'>
      <button className="btn w-full h-10  " onClick={openModal}>
        <ListSvg />
      </button>

      <dialog id="currency_list_modal" className="modal">

        <div className="modal-box max-w-[460px] p-2">

          <div role="tablist" className="tabs tabs-bordered mb-2">
            <a role="tab" className={`tab ${activeTab === 1 ? 'tab-active' : ''}`} onClick={() => setActiveTab(1)}>
              <TableSvg />
            </a>
            <a role="tab" className={`tab ${activeTab === 2 ? 'tab-active' : ''}`} onClick={() => setActiveTab(2)}>
              <SettingSvg />
            </a>
            <a role="tab" className={`tab`} onClick={closeModal}>
              <XSvg />
            </a>
          </div>

          {/* Tab content rendering */}
          {activeTab === 1 && <div>
            <CurrencyListTable data={data} currency2Display={currency2Display} addCurrency2Display={addCurrency2Display} removeCurrency2Display={removeCurrency2Display} />
          </div>}
          {activeTab === 2 && <div>
            <MemoizedCurrencySetting isDefaultCurrencyValue={isDefaultCurrencyValue} defaultCurrencyValue={defaultCurrencyValue}
              setIsDefaultCurrencyValue={setIsDefaultCurrencyValue} setDefaultCurrencyValue={setDefaultCurrencyValue}
              isEditing={isEditing} setIsEditing={setIsEditing}
            />
          </div>}
          {/* {activeTab === 3 && <div>Content for Tab 3</div>} */}

        </div>
        <form method="dialog" className="modal-backdrop">
          <button />
        </form>
      </dialog>
    </div>
  );
}

export default CurrencyListModal;
