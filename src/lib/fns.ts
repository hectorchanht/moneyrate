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

// Decimal places for a currency row given viewport width and edit mode.
// Extracted from the render loop so it can be unit-tested in isolation.
export const getResponsiveCryptoDp = (windowWidth: number, isEditing: boolean): number => {
  let cryptoDp = 6;
  if (isEditing) {
    if (windowWidth < 410) cryptoDp = 4;
    if (windowWidth < 370) cryptoDp = 3;
  }
  if (windowWidth < 300) cryptoDp = 2;
  return cryptoDp;
};

// Clamp a drag-drop Y offset to a valid splice index so dropping above/below
// the list can't produce a negative or out-of-range insertion point.
export const getDropIndex = (dropY: number, itemHeight: number, length: number): number => {
  const rawIndex = Math.floor(dropY / itemHeight);
  return Math.max(0, Math.min(rawIndex, length - 1));
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

export const setDataToLocalStorage = (name: string, value: unknown) => {
  if (typeof window === "undefined" || !window || !window.localStorage) return;
  try {
    localStorage.setItem(name, JSON.stringify(value));
  } catch {
    // Ignore quota / serialization errors — caching is best-effort.
  }
};