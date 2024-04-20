import { runtimeModule, RuntimeModule, state, runtimeMethod } from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { UInt64, } from "@proto-kit/library";
import { SecurityCode, AgentDetails, MessageStruct } from "./message";
import { Field } from "o1js";


@runtimeModule()
export class SpyMessages extends RuntimeModule<Record<string, never>> {

  @state() public agents = StateMap.from<UInt64, AgentDetails>(
    UInt64,
    AgentDetails
  );


  @runtimeMethod()
  public addMessage(agentId: UInt64, securityCode: SecurityCode, messageContent: MessageStruct, messageNo: UInt64): void {
    const someAgent = this.agents.get(UInt64.from(agentId))
    //check if agent exists
    assert(someAgent.isSome, "Agent code is present")
    const agent = new AgentDetails(someAgent.value)
    //check if security code matches
    assert(securityCode.char1.equals(agent.securityCode1), "Secuity Code 1 is wrong")
    assert(securityCode.char2.equals(agent.securityCode2), "Secuity Code 2 is wrong")
    //check if message no is greater than current  
    assert(agent.lastMessageNo.lessThan(messageNo), "Message number should be greater")
    //check message length
    assert(messageContent.content.length().lessThanOrEqual(Field(12)))
    
    //update the message no in state
    agent.lastMessageNo = messageNo
    this.agents.set(agentId, agent)
  }

  @runtimeMethod()
  public addAgent(
    Id: UInt64,
    securityCode: SecurityCode
  ): void {
    var agent = new AgentDetails({
      lastMessageNo: UInt64.from(0),
      securityCode1: securityCode.char1,
      securityCode2: securityCode.char2,
    })
    this.agents.set(Id, agent);

  }
}
