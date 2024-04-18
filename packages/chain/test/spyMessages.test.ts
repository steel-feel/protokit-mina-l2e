import { TestingAppChain } from "@proto-kit/sdk";
import { Character, CircuitString, PrivateKey } from "o1js";
import { Balances } from "../src/balances";
import { SpyMessages } from "../src/spyMessages";

import { log } from "@proto-kit/common";
import { UInt64 } from "@proto-kit/library";
import { securityCode } from "../src/message";

log.setLevel("ERROR");


describe("Spy Message Network", () => {
  let adminPrivateKey, admin
  
  it("should add agent", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
      SpyMessages
    });

    adminPrivateKey = PrivateKey.random();
    admin = adminPrivateKey.toPublicKey();

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        SpyMessages : {
          admin 
        }
      },
    });

    await appChain.start();

    appChain.setSigner(adminPrivateKey);

    const spyMessages = appChain.runtime.resolve("SpyMessages");
    const secCode = new securityCode({
      char1 : Character.fromString('a'),
      char2 : Character.fromString('0'),
    })

    const tx1 = await appChain.transaction(admin, () => {
      spyMessages.addAgent(UInt64.from(1000) ,secCode);
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();

    const key = UInt64.from(1000)
    const onChainSecCodeValue = await appChain.query.runtime.SpyMessages.agents.get(key);
    
    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(onChainSecCodeValue?.char1.toString()).toBe('a');
    expect(onChainSecCodeValue?.char2.toString()).toBe('0');
  }, 1_000_000);
});
