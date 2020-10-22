/// @ts-nocheck
import Command from '../../core/command';
import { CommonLibrary, getContent } from '../../core/lib';

export default new Command({
  description: 'OwO-ifies the input.',
  async run($: CommonLibrary): Promise<any> {
    let url = new URL(`https://nekos.life/api/v2/owoify?text=${$.args.join(' ')}`);
    const content = await getContent(url.toString());
    $.channel.send(content.owo);
  },
});
