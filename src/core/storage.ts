import fs from 'fs';
import $ from './lib';

const Storage = {
  read(header: string): object {
    this.open('data');
    const path = `data/${header}.json`;
    let data = {};

    if (fs.existsSync(path)) {
      const file = fs.readFileSync(path, 'utf-8');

      try {
        data = JSON.parse(file);
      } catch (error) {
        if (process.argv[2] !== 'dev') {
          $.warn(
            `Malformed JSON data (header: ${header}), backing it up.`,
            file,
          );
          fs.writeFile(
            `${path}.backup`,
            file,
            generateHandler(
              `Backup file of "${header}" successfully written as ${file}.`,
            ),
          );
        }
      }
    }

    return data;
  },
  write(header: string, data: object, asynchronous = true) {
    this.open('data');
    const path = `data/${header}.json`;

    if (process.argv[2] === 'dev' || header === 'config') {
      const result = JSON.stringify(data, null, '\t');

      if (asynchronous)
        fs.writeFile(
          path,
          result,
          generateHandler(`"${header}" sucessfully spaced and written.`),
        );
      else fs.writeFileSync(path, result);
    } else {
      const result = JSON.stringify(data);

      if (asynchronous)
        fs.writeFile(
          path,
          result,
          generateHandler(`"${header}" sucessfully written.`),
        );
      else fs.writeFileSync(path, result);
    }
  },
  open(
    path: string,
    filter?: (value: string, index: number, array: string[]) => unknown,
  ): string[] {
    if (!fs.existsSync(path)) fs.mkdirSync(path);

    let directory = fs.readdirSync(path);

    if (filter) directory = directory.filter(filter);

    return directory;
  },
  close(path: string) {
    if (fs.existsSync(path) && fs.readdirSync(path).length === 0)
      fs.rmdir(path, generateHandler(`"${path}" successfully closed.`));
  },
};

export function generateHandler(message: string) {
  return (error: Error | null) => {
    if (error) $.error(error);
    else $.debug(message);
  };
}

export default Storage;
