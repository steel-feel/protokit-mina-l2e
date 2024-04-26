import { runtimeModule, runtimeMethod, state } from "@proto-kit/module";
import { SpyMessages } from "./spyMessages"
import { UInt64 } from "@proto-kit/library";
import {  ExtendedAgentDetails,  MessageVerificationInput, SecurityCode } from "./message";
import { StateMap, State, assert } from "@proto-kit/protocol";
import { Field, Experimental, CircuitString, MerkleMapWitness } from "o1js";

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
export class CanMessageProof extends Experimental.ZkProgram.Proof(canMessageProgram) { }

//TODO: try to insert extendedAgent into agents

@runtimeModule()
export class SecureSpyNetwork extends SpyMessages {

  @state() public extendedAgents = StateMap.from<Field, ExtendedAgentDetails>(
    Field,
    ExtendedAgentDetails
  );

  @state() public root = State.from<Field>(Field);


  @runtimeMethod()
  public sendMessage(
    proof: CanMessageProof,
  ): void {
    proof.verify()

    const someAgent = this.extendedAgents.get(  proof.publicInput.agentId   );

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

    this.root.set(proof.publicOutput)

    this.extendedAgents.set(proof.publicInput.agentId, agent)
  }

  @runtimeMethod()
  public override addAgent(
    Id: UInt64,
    securityCode: SecurityCode
  ): void {    
    /// DO Nothing
  }

  @runtimeMethod()
  public addAgentNew(
    Id: Field,
    securityCode: SecurityCode,
    root: Field
  ): void {

    var agent = new ExtendedAgentDetails({
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