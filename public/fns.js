import fs from 'fs';
import { Readable } from 'stream';

export const downloadCoincapIcons = async () => {
  const allCurrencies = await fetch('https://latest.currency-api.pages.dev/v1/currencies.json');
  const currencies = await allCurrencies.json();

  // Create the directory if it doesn't exist
  const dir = './crypto-icons';
  await fs.promises.mkdir(dir, { recursive: true });

  Object.entries(currencies).forEach(async ([code]) => {
    if (fs.existsSync(`${dir}/${code}.svg`) || fs.existsSync(`${dir}/${code}.png`)) {
      return;
    }

    const uri = `https://assets.coincap.io/assets/icons/${code}@2x.png`;

    // Fetch the image
    const response = await fetch(uri);
    if (!response.ok) {
      return;
    }
    const blob = await response.blob();
    // console.log(` fns.js --- ${code} blob:`, blob)

    // Create a file name based on currency code
    const fileName = `${dir}/${code}.png`;

    // Save the image
    const fileStream = fs.createWriteStream(fileName);
    const readableStream = Readable.from(blob.stream());
    readableStream.pipe(fileStream);
  });

};
downloadCoincapIcons();