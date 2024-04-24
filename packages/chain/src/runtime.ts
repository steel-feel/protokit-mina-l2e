import { Balance } from "@proto-kit/library";
import { Balances } from "./balances";
import { ModulesConfig } from "@proto-kit/common";
import { SpyMessages } from "./spyMessages";
import { SecureSpyNetwork } from "./secureSpyNetwork";
import { transaction } from "o1js/dist/node/lib/mina";
import { PrivateKey } from "o1js";

export const modules = {
  Balances,
  SpyMessages,
  SecureSpyNetwork
};

export const adminPrivateKey = PrivateKey.random();
export const admin = adminPrivateKey.toPublicKey();

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  SpyMessages  : { },
  SecureSpyNetwork : {}
};

export default {
  modules,
  config,
};
