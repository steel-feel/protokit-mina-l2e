import { runtimeModule, runtimeMethod, state } from "@proto-kit/module";
import { SpyMessages } from "./spyMessages"
import { UInt64 } from "@proto-kit/library";
import {  ExtendedAgentDetails,  MessageVerificationInput, SecurityCode } from "./message";
import { StateMap, State, assert } from "@proto-kit/protocol";
import { Field, Experimental, CircuitString, MerkleMapWitness } from "o1js";
import { inject } from "tsyringe"


//TODO: try to store the messages as well

// your zk-circuit proving the user is eligible to mint
/**
 * 
 * @param witness merkle witness
 * @param message message to append
 * @returns new Root of message
 */
const canMessage = (
  publicInput: MessageVerificationInput,
  witness: MerkleMapWitness,
  message: CircuitString,
  lastMessageNo: Field,
  currentMsgNo: Field): Field => {
  //check message length
  //@ts-ignore
  message.length().assertLessThanOrEqual(Field(12))

  const [,agentId ] = witness.computeRootAndKey(lastMessageNo)
  agentId.assertEquals(publicInput.agentId)

  //TODO: Should we add agent Id check as well ?
  
  //check if message no is greater than current  
  lastMessageNo.assertLessThan(currentMsgNo)

  const [rootAfter,] = witness.computeRootAndKey(currentMsgNo)

  return rootAfter
};


// your zk program goes here
export const canMessageProgram = Experimental.ZkProgram({
  publicOutput: Field,
  publicInput: MessageVerificationInput,

  methods: {
    canMessage: {
      privateInputs: [MerkleMapWitness, CircuitString, Field, Field],
      // eslint-disable-next-line putout/putout
      method: canMessage
    },
  },
});


// define the type of the proof
class CanMintProof extends Experimental.ZkProgram.Proof(canMessageProgram) { }

// generate a dummy proof, to be used when testing the runtime method
// const [, dummy] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);
// const publicInput = Field(0);
// const proof = new ProgramProof({
//   proof: dummy,
//   publicOutput: canMint(publicInput),
//   publicInput,
//   maxProofsVerified: 2,
// });

//TODO: try to insert extendedAgent into agents


@runtimeModule()
export class SecureSpyNetwork extends SpyMessages {

  @state() public extendedAgents = StateMap.from<UInt64, ExtendedAgentDetails>(
    UInt64,
    ExtendedAgentDetails
  );

  @state() public messages = StateMap.from<UInt64, Field>(
    UInt64,
    Field
  );

  @state() public root = State.from<Field>(Field);

  // constructor( @inject("SpyMessages") private balances: SpyMessages ) {
  //   super()
  //   this.root.set(Field(0))
  // }

  @runtimeMethod()
  public sendMessage(
    agentId: UInt64,
    proof: CanMintProof,
  ): void {
    proof.verify()

    const someAgent = this.extendedAgents.get(agentId);

    assert(someAgent.isSome, "Agent code is present")
    const agent = new ExtendedAgentDetails(someAgent.value)

    //check if security code matches
    assert(proof.publicInput.securityCode1.equals(agent.securityCode1), "Secuity Code 1 is wrong")
    assert(proof.publicInput.securityCode2.equals(agent.securityCode2), "Secuity Code 2 is wrong")

    //check if root matches
    assert(proof.publicInput.root.equals(this.root.get().value), "Message roots are not equal")

    //Update values
    agent.blockHeight = UInt64.from(this.network.block.height)
    agent.sender = this.transaction.sender.value
    agent.nonce = UInt64.from(this.transaction.nonce.value),
    agent.blockHeight = UInt64.from(this.network.block.height)
    agent.root = proof.publicOutput


    this.root.set(proof.publicOutput)

    this.extendedAgents.set(agentId, agent)
  }

  @runtimeMethod()
  public override addAgent(
    Id: UInt64,
    securityCode: SecurityCode
  ): void {

    /*
    var agent = new ExtendedAgentDetails({
      root: Field(0),
      securityCode1: securityCode.char1,
      securityCode2: securityCode.char2,
      sender: this.transaction.sender.value,
      nonce: UInt64.from(this.transaction.nonce.value),
      blockHeight: UInt64.from(this.network.block.height)
    })

    this.extendedAgents.set(Id, agent);
    */
    
    /// DO Nothing
    
  }

  @runtimeMethod()
  public addAgentNew(
    Id: UInt64,
    securityCode: SecurityCode,
    root: Field
  ): void {

    var agent = new ExtendedAgentDetails({
      root: Field(0),
      securityCode1: securityCode.char1,
      securityCode2: securityCode.char2,
      sender: this.transaction.sender.value,
      nonce: UInt64.from(this.transaction.nonce.value),
      blockHeight: UInt64.from(this.network.block.height)
    })

    this.extendedAgents.set(Id, agent);
    this.root.set(root)
    
  }





}