import React, { useState } from 'react'; // Add useState import
import { AddSvg, CrossSvg, ListSvg, SettingSvg, TableSvg, XSvg } from '../svgs';
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

const CurrencySetting: React.FC<CurrencySettingProps> = ({
  isDefaultCurrencyValue, defaultCurrencyValue, setIsDefaultCurrencyValue, setDefaultCurrencyValue, isEditing, setIsEditing
}) => {

  return (
    <div>
      <div className="form-control">
        <label className="label cursor-pointer">
          <input type="checkbox" checked={isEditing} onChange={() => {
            setIsEditing(!isEditing);
          }} className="checkbox" />
          <span className="label-text">
            Enable Editing
          </span>
        </label>

        <div className="divider m-0" />

        <label className="label cursor-pointer">
          <input type="checkbox" checked={isDefaultCurrencyValue} onChange={() => {
            setIsDefaultCurrencyValue(!isDefaultCurrencyValue);
          }} className="checkbox" />
          <span className="label-text justify-between items-center flex gap-2 ml-2">
            Set Value
            <input type="number" className="w-[50%] bg-black" placeholder={defaultCurrencyValue.toString()} disabled={!isDefaultCurrencyValue}
              onChange={(d) => {
                setDefaultCurrencyValue(parseInt(d.target.value));
              }}
            />
          </span>
        </label>

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

  return <div className="overflow-x-auto">
    <table className="table">
      <thead>
        <tr>
          <td></td>
          <th>Code</th>
          <th>Name</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {data && Object.entries(data).map(([code, name]) => {
          return <tr className="hover" key={code}>
            <td className='p-0'><CountryImg code={code} /></td>
            <td className='px-0 text-center'>{code}</td>
            <td className='px-0 truncate' title={name}>{name}</td>
            <td className='p-0 '>
              {
                currency2Display.includes(code)
                  ? <CrossSvg className={'cursor-pointer size-6'} onClick={() => removeCurrency2Display({ name: code })} />
                  : <AddSvg className={'cursor-pointer size-6'} onClick={() => addCurrency2Display({ name: code })} />
              }
            </td>
          </tr>
        })}
      </tbody>
    </table>
  </div>
};

const MemoizedCurrencyListTable = React.memo(CurrencyListTable, (prev, next) => {
  return prev.currency2Display === next.currency2Display;
});


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
    <div>
      <button className="btn w-full h-10" onClick={openModal}>
        <ListSvg />
      </button>

      <dialog id="currency_list_modal" className="modal">
        <button className="btn rounded-full p-0 absolute bottom-[10vh] z-20 w-14 h-14" onClick={closeModal}>
          <XSvg />
        </button>

        <div className="modal-box max-w-[460px] p-2">

          <div role="tablist" className="tabs tabs-bordered mb-2">
            <a role="tab" className={`tab ${activeTab === 1 ? 'tab-active' : ''}`} onClick={() => setActiveTab(1)}>
              <TableSvg />
            </a>
            <a role="tab" className={`tab ${activeTab === 2 ? 'tab-active' : ''}`} onClick={() => setActiveTab(2)}>
              <SettingSvg />
            </a>
            {/* <a role="tab" className={`tab ${activeTab === 3 ? 'tab-active' : ''}`} onClick={() => setActiveTab(3)}>Tab 3</a> */}
          </div>

          {/* Tab content rendering */}
          {activeTab === 1 && <div>
            <MemoizedCurrencyListTable data={data} currency2Display={currency2Display} addCurrency2Display={addCurrency2Display} removeCurrency2Display={removeCurrency2Display} />
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
