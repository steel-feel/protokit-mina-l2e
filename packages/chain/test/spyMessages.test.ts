import { TestingAppChain } from "@proto-kit/sdk";
import { Character, CircuitString, PrivateKey } from "o1js";
import { Balances } from "../src/balances";
import { SpyMessages } from "../src/spyMessages";

import { log } from "@proto-kit/common";
import { UInt64 } from "@proto-kit/library";

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

    const tx1 = await appChain.transaction(admin, () => {
      spyMessages.addAgent(UInt64.from(1000) , CircuitString.fromCharacters([
        Character.fromString('a'),
        Character.fromString('0'),
      ]));
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();

    const key = UInt64.from(1000)
    const secCode = await appChain.query.runtime.SpyMessages.agents.get(key);

    console.log(JSON.stringify(secCode));
    
    
    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(secCode).toBe(CircuitString.fromCharacters([
      Character.fromString('a'),
      Character.fromString('0'),
    ]));
  }, 1_000_000);
});
