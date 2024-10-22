interface CurrencyListModalProps {
  data: Record<string, string>;
}


const CurrencyListTable: React.FC<CurrencyListModalProps> = ({ data }) => {

  return <div className="overflow-x-auto">
  <table className="table">
    <thead>
      <tr>
        <th>Code</th>
        <th>Name</th>
      </tr>
    </thead>
    <tbody>
        {data && Object.entries(data).map(([code, name]) => {
          return <tr className="hover" key={code}>
            <td>{code}</td>
            <td>{name}</td>
          </tr>
        })}
    </tbody>
  </table>
</div>
}


const CurrencyListModal: React.FC<CurrencyListModalProps> = ({ data }) => {
  const openModal = () => {
    const modal = document.getElementById('currency_list_modal') as HTMLDialogElement;
    modal?.showModal();
  };

  console.log('data',data)
  return (
    <div>
      <button className="btn w-full h-10" onClick={openModal}>
        check currencies
      </button>


      <dialog id="currency_list_modal" className="modal">
        <div className="modal-box w-[50%] min-w-[200px] p-6">
          <CurrencyListTable data={data} />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button />
        </form>
      </dialog>
    </div>
  );
}

export default CurrencyListModal;