import { TestingAppChain } from "@proto-kit/sdk";
import { Character, PrivateKey } from "o1js";
import { Balances } from "../src/balances";
import { SpyMessages } from "../src/spyMessages";

import { log } from "@proto-kit/common";
import { UInt64 } from "@proto-kit/library";
import { MessageStruct, SecurityCode } from "../src/message";

log.setLevel("ERROR");


describe("Spy Message Network", () => {
  let adminPrivateKey: any, admin: any
  let appChain: ReturnType<
    typeof TestingAppChain.fromRuntime<{
      Balances: typeof Balances,
      SpyMessages: typeof SpyMessages
    }>
  >;
  let spyMessages: SpyMessages

  beforeAll(async () => {
    appChain = TestingAppChain.fromRuntime({
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
        SpyMessages: {}
      },
    });

    await appChain.start();
    spyMessages = appChain.runtime.resolve("SpyMessages");
    appChain?.setSigner(adminPrivateKey);
  })


  it("should add agent", async () => {
    const agentId = UInt64.from("1000")
    const secCode = new SecurityCode({
      char1: Character.fromString('a'),
      char2: Character.fromString('0'),
    })

    const tx1 = await appChain.transaction(admin, () => {
      spyMessages.addAgent(agentId, secCode);
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();
    expect(block?.transactions[0].status.toBoolean()).toBe(true);

    const onChainAgent = await appChain.query.runtime.SpyMessages.agents.get(agentId);
    expect(onChainAgent?.securityCode1.toString()).toBe('a');
    expect(onChainAgent?.securityCode2.toString()).toBe('0');

  }, 1_000_000);

  it("should add message", async () => {
    const agentId = UInt64.from("1000")
    const secCode = new SecurityCode({
      char1: Character.fromString('a'),
      char2: Character.fromString('0'),
    })
    const newMessageNo = UInt64.from(1)

    const content = new MessageStruct("hello")
    const tx2 = await appChain.transaction(admin, async () => {
      spyMessages.addMessage(agentId, secCode, content, newMessageNo);
    });

    await tx2.sign();
    await tx2.send();

    const block = await appChain.produceBlock();
    expect(block?.transactions[0].status.toBoolean()).toBe(true);

    const onChainAgent = await appChain.query.runtime.SpyMessages.agents.get(agentId);
    expect(onChainAgent?.lastMessageNo.toString()).toBe(newMessageNo.toString())

  }, 1_000_000);

  it("Can not send message length greater than 12", async () => {
    try {
      new MessageStruct("This message length is greater than twelve")
    } catch (err) {
      expect(true).toBeTruthy();

    }
  })

});
