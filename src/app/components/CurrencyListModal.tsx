import { AddSvg, CrossSvg, ListSvg } from '../svgs';
import CountryImg from './CountryImg';


interface CurrencyListModalProps {
  data: Record<string, string>;
  currency2Display: string[];
  removeCurrency2Display: (params: { name: string }) => void;
  addCurrency2Display: (params: { name: string }) => void;
}

const CurrencyListTable: React.FC<CurrencyListModalProps> = ({ data, addCurrency2Display, currency2Display, removeCurrency2Display }) => {

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


const CurrencyListModal: React.FC<CurrencyListModalProps> = ({ data, currency2Display, removeCurrency2Display, addCurrency2Display }) => {
  const openModal = () => {
    const modal = document.getElementById('currency_list_modal') as HTMLDialogElement;
    modal?.showModal();
  };

  return (
    <div>
      <button className="btn w-full h-10" onClick={openModal}>
        {/* check currencies */}
        <ListSvg />
      </button>

      <dialog id="currency_list_modal" className="modal">
        <div className="modal-box max-w-[460px] p-2">
          <CurrencyListTable data={data} currency2Display={currency2Display} addCurrency2Display={addCurrency2Display} removeCurrency2Display={removeCurrency2Display} />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button />
        </form>
      </dialog>
    </div>
  );
}

export default CurrencyListModal;