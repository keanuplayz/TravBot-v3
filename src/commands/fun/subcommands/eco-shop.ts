import Command from '../../../core/command';
import $ from '../../../core/lib';
import { Storage } from '../../../core/structures';
import { isAuthorized, getMoneyEmbed, getSendEmbed } from './eco-utils';

export const BuyCommand = new Command({
  description: '',
  async run({ guild, channel }) {
    if (isAuthorized(guild, channel)) {
    }
  },
});

export const ShopCommand = new Command({
  description: '',
  async run({ guild, channel }) {
    if (isAuthorized(guild, channel)) {
    }
  },
});
