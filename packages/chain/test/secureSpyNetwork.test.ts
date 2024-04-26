import { TestingAppChain } from "@proto-kit/sdk";
import { Character, Field, PrivateKey, PublicKey } from "o1js";

import { Balances } from "../src/balances";

import { SecureSpyNetwork, CanMessageProof } from "../src/secureSpyNetwork";


import { log } from "@proto-kit/common";
import { UInt64 } from "@proto-kit/library";
import { MessageVerificationInput, SecurityCode, messagesMap } from "../src/message";

/// Proof system
import { Pickles } from "o1js/dist/node/snarky";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof_system";

log.setLevel("ERROR");

async function mockProof(
  publicInput:MessageVerificationInput,
  publicOutput: Field,
): Promise<CanMessageProof> {
  const [, proof] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);
  return new CanMessageProof({
    proof,
    maxProofsVerified: 2,
    publicInput ,
    publicOutput,
  });
}

describe("Secure Spy-Message Network", () => {
  let adminPrivateKey: PrivateKey, admin: PublicKey
  let appChain: ReturnType<
    typeof TestingAppChain.fromRuntime<{
      Balances: typeof Balances,
      SecureSpyNetwork: typeof SecureSpyNetwork
    }>
  >;
  let secureSpyNetwork: SecureSpyNetwork

  beforeAll(async () => {
    appChain = TestingAppChain.fromRuntime({
      Balances,
      SecureSpyNetwork
    });

    adminPrivateKey = PrivateKey.random();
    admin = adminPrivateKey.toPublicKey();

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        SecureSpyNetwork: {}
      },
    });

    await appChain.start();

    secureSpyNetwork = appChain.runtime.resolve("SecureSpyNetwork");
    appChain?.setSigner(adminPrivateKey);
  }, 1_000_000);


  it("should add agent", async () => {
    const agentId = Field("1000")
    const secCode = new SecurityCode({
      char1: Character.fromString('a'),
      char2: Character.fromString('0'),
    })
    const agentAsField = Field(agentId.toString())
    messagesMap.set(agentAsField, Field(0))

    const tx1 = await appChain.transaction(admin, () => {
      // secureSpyNetwork.addAgent(agentId, secCode);
      secureSpyNetwork.addAgentNew(agentId, secCode, messagesMap.getRoot());
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();
    expect(block?.transactions[0].status.toBoolean()).toBe(true);

    const onChainAgent = await appChain.query.runtime.SecureSpyNetwork.extendedAgents.get(agentId);
    expect(onChainAgent?.securityCode1.toString()).toBe('a');
    expect(onChainAgent?.securityCode2.toString()).toBe('0');

  }, 1_000_000);


  it("Should send messages", async () => {
    const agentId = Field("1000")
    const messageNo = Field(1)
    //add values to tree
    const agentAsField = Field(agentId.toString())
    //create witness
    messagesMap.set(agentAsField, Field(0))
    const witness = messagesMap.getWitness(agentAsField)
    const [newRoot,] = witness.computeRootAndKey(messageNo)
    const onChainRoot = await appChain.query.runtime.SecureSpyNetwork.root.get();
    //create proof
    const programInput = new MessageVerificationInput({
      root: onChainRoot || messagesMap.getRoot(),
      agentId: agentAsField,
      securityCode1: Character.fromString('a'),
      securityCode2: Character.fromString('0'),
    })
    const proof = await mockProof(programInput,newRoot)
    //do TX
    const tx1 = await appChain.transaction(admin, () => {
      secureSpyNetwork.sendMessage(proof)
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();
    expect(block?.transactions[0].status.toBoolean()).toBe(true);

    const newOnChainRoot = await appChain.query.runtime.SecureSpyNetwork.root.get();
    expect(newOnChainRoot?.toString()).toBe(newRoot.toString());

  }, 1_000_000);

})