// Debounce function (example)
export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export const showASCIIArt = () => {
  // https://patorjk.com/software/taag/#p=display&h=1&f=Delta%20Corps%20Priest%201&t=Money%20%0ARate%0Alol
  const art = `
   ▄▄▄▄███▄▄▄▄    ▄██████▄  ███▄▄▄▄      ▄████████ ▄██   ▄        
 ▄██▀▀▀███▀▀▀██▄ ███    ███ ███▀▀▀██▄   ███    ███ ███   ██▄      
 ███   ███   ███ ███    ███ ███   ███   ███    █▀  ███▄▄▄███      
 ███   ███   ███ ███    ███ ███   ███  ▄███▄▄▄     ▀▀▀▀▀▀███      
 ███   ███   ███ ███    ███ ███   ███ ▀▀███▀▀▀     ▄██   ███      
 ███   ███   ███ ███    ███ ███   ███   ███    █▄  ███   ███      
 ███   ███   ███ ███    ███ ███   ███   ███    ███ ███   ███      
  ▀█   ███   █▀   ▀██████▀   ▀█   █▀    ██████████  ▀█████▀       
                                                                      
       ▄████████    ▄████████     ███        ▄████████                
      ███    ███   ███    ███ ▀█████████▄   ███    ███                
      ███    ███   ███    ███    ▀███▀▀██   ███    █▀                 
     ▄███▄▄▄▄██▀   ███    ███     ███   ▀  ▄███▄▄▄                    
    ▀▀███▀▀▀▀▀   ▀███████████     ███     ▀▀███▀▀▀                    
    ▀███████████   ███    ███     ███       ███    █▄                 
      ███    ███   ███    ███     ███       ███    ███                
      ███    ███   ███    █▀     ▄████▀     ██████████                
      ███    ███                                                      
              ▄█        ▄██████▄   ▄█                                          
             ███       ███    ███ ███                                          
             ███       ███    ███ ███                                          
             ███       ███    ███ ███                                          
             ███       ███    ███ ███                                          
             ███       ███    ███ ███                                          
      ███    ███▌    ▄ ███    ███ ███▌    ▄                                    
      ███    █████▄▄██  ▀██████▀  █████▄▄██                                    
             ▀                    ▀                                            
https://github.com/hectorchanht/moneyrate`;
  console.log(art);
};

export const getDataFromLocalStorage = (name: string, defaultValue: any) => {
  if (typeof window === "undefined" || !window || !window.localStorage) return defaultValue
  const lsData = localStorage.getItem(name);
  if (lsData === null) return defaultValue;

  try {
    const lsDataParsed = JSON.parse(lsData);
    return lsDataParsed;
  } catch {
    return lsData
  }
};