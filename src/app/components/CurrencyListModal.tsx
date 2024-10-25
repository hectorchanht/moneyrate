import React, { useState } from 'react'; // Add useState import
import { AddSvg, CrossSvg, ListSvg } from '../svgs';
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

        <div className="divider" />

        <label className="label cursor-pointer">
          <input type="checkbox" checked={isDefaultCurrencyValue} onChange={() => {
            setIsDefaultCurrencyValue(!isDefaultCurrencyValue);
          }} className="checkbox" />
          <span className="label-text">
            Customize Base Value
          </span>
        </label>

        <label className="input flex items-center justify-between p-2 gap-2 bg-transparent">
          Base Value
          <input type="number" className="w-[50%] " placeholder={defaultCurrencyValue.toString()} disabled={!isDefaultCurrencyValue}
            onChange={(d) => {
              console.log('d', d.target.value);
              setDefaultCurrencyValue(parseInt(d.target.value));
            }}
          />
        </label>

      </div>
    </div>
  )
}
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
            <td><CountryImg code={code} /></td>
            <td>{code}</td>
            <td>{name}</td>
            <td>
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
}


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

  return (
    <div>
      <button className="btn w-full h-10" onClick={openModal}>
        <ListSvg />
      </button>

      <dialog id="currency_list_modal" className="modal">
        <div className="modal-box max-w-[460px] p-2">

          <div role="tablist" className="tabs tabs-bordered">
            <a role="tab" className={`tab ${activeTab === 1 ? 'tab-active' : ''}`} onClick={() => setActiveTab(1)}>
              Table
            </a>
            <a role="tab" className={`tab ${activeTab === 2 ? 'tab-active' : ''}`} onClick={() => setActiveTab(2)}>
              Setting
            </a>
            {/* <a role="tab" className={`tab ${activeTab === 3 ? 'tab-active' : ''}`} onClick={() => setActiveTab(3)}>Tab 3</a> */}
          </div>

          {/* Tab content rendering */}
          {activeTab === 1 && <div>
            <CurrencyListTable data={data} currency2Display={currency2Display} addCurrency2Display={addCurrency2Display} removeCurrency2Display={removeCurrency2Display} />
          </div>}
          {activeTab === 2 && <div>
            <CurrencySetting isDefaultCurrencyValue={isDefaultCurrencyValue} defaultCurrencyValue={defaultCurrencyValue}
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
